<?php

namespace App\Services;

use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

/**
 * 核心库存服务
 * - 所有出入库操作必须通过这里，保证：
 *   1. stocks 表数量一致
 *   2. stock_movements 流水完整
 *   3. 加权平均成本正确计算
 *   4. 行级锁防并发
 */
class StockService
{
    /**
     * 入库（采购入库 / 调拨入 / 盘盈 / 其它入库）
     * 同时按加权平均更新成本
     */
    public function in(array $params): StockMovement
    {
        $this->validateParams($params, ['quantity', 'unit_cost']);
        if ($params['quantity'] <= 0) throw new InvalidArgumentException('入库数量必须 > 0');

        return DB::transaction(function () use ($params) {
            $stock = $this->lockStock($params);
            $qtyBefore = (float) $stock->quantity;
            $qtyDelta = (float) $params['quantity'];
            $unitCost = (float) $params['unit_cost'];
            $qtyAfter = $qtyBefore + $qtyDelta;

            // 加权平均成本
            // newAvg = (oldQty * oldAvg + addQty * addCost) / (oldQty + addQty)
            $oldAvgCost = (float) $stock->avg_cost;
            $newAvgCost = $qtyAfter > 0
                ? ($qtyBefore * $oldAvgCost + $qtyDelta * $unitCost) / $qtyAfter
                : $unitCost;

            $stock->update([
                'quantity' => $qtyAfter,
                'avg_cost' => $newAvgCost,
            ]);

            return StockMovement::create([
                'warehouse_id' => $params['warehouse_id'],
                'product_id'   => $params['product_id'],
                'variant_id'   => $params['variant_id'] ?? null,
                'type'         => $params['type'] ?? 'stock_in',
                'quantity'     => $qtyDelta,
                'unit_cost'    => $unitCost,
                'total_cost'   => $qtyDelta * $unitCost,
                'quantity_before' => $qtyBefore,
                'quantity_after'  => $qtyAfter,
                'source_type'  => $params['source_type'] ?? null,
                'source_id'    => $params['source_id'] ?? null,
                'source_no'    => $params['source_no'] ?? null,
                'user_id'      => $params['user_id'] ?? auth()->id(),
                'remark'       => $params['remark'] ?? null,
            ]);
        });
    }

    /**
     * 出库（销售出库 / 调拨出 / 盘亏 / 其它出库）
     * 使用当前 avg_cost 作为出库成本
     */
    public function out(array $params): StockMovement
    {
        $this->validateParams($params, ['quantity']);
        if ($params['quantity'] <= 0) throw new InvalidArgumentException('出库数量必须 > 0');

        return DB::transaction(function () use ($params) {
            $stock = $this->lockStock($params);
            $qtyBefore = (float) $stock->quantity;
            $qtyDelta = (float) $params['quantity'];
            $qtyAfter = $qtyBefore - $qtyDelta;

            // 检查负库存
            if ($qtyAfter < 0 && ! config('inventory.allow_negative_stock')) {
                throw new RuntimeException(
                    sprintf('库存不足：仓库 %d 商品 %d 当前 %.4f，出库需要 %.4f',
                        $params['warehouse_id'], $params['product_id'], $qtyBefore, $qtyDelta)
                );
            }

            // 出库成本 = 当前加权平均成本（除非外部指定）
            $unitCost = isset($params['unit_cost']) ? (float) $params['unit_cost'] : (float) $stock->avg_cost;

            $stock->update(['quantity' => $qtyAfter]);

            return StockMovement::create([
                'warehouse_id' => $params['warehouse_id'],
                'product_id'   => $params['product_id'],
                'variant_id'   => $params['variant_id'] ?? null,
                'type'         => $params['type'] ?? 'stock_out',
                'quantity'     => -$qtyDelta,
                'unit_cost'    => $unitCost,
                'total_cost'   => -($qtyDelta * $unitCost),
                'quantity_before' => $qtyBefore,
                'quantity_after'  => $qtyAfter,
                'source_type'  => $params['source_type'] ?? null,
                'source_id'    => $params['source_id'] ?? null,
                'source_no'    => $params['source_no'] ?? null,
                'user_id'      => $params['user_id'] ?? auth()->id(),
                'remark'       => $params['remark'] ?? null,
            ]);
        });
    }

    /**
     * 调拨：A 仓出，B 仓入。一个事务内完成
     * @return array [out movement, in movement]
     */
    public function transfer(array $params): array
    {
        return DB::transaction(function () use ($params) {
            // 先在源仓库出库（按 avg_cost）
            $outMove = $this->out([
                'warehouse_id' => $params['from_warehouse_id'],
                'product_id'   => $params['product_id'],
                'variant_id'   => $params['variant_id'] ?? null,
                'quantity'     => $params['quantity'],
                'type'         => 'transfer_out',
                'source_type'  => $params['source_type'] ?? null,
                'source_id'    => $params['source_id'] ?? null,
                'source_no'    => $params['source_no'] ?? null,
                'user_id'      => $params['user_id'] ?? auth()->id(),
                'remark'       => $params['remark'] ?? '调拨出库',
            ]);

            // 然后在目标仓库入库（用源仓库的 avg_cost 作为入库成本）
            $inMove = $this->in([
                'warehouse_id' => $params['to_warehouse_id'],
                'product_id'   => $params['product_id'],
                'variant_id'   => $params['variant_id'] ?? null,
                'quantity'     => $params['quantity'],
                'unit_cost'    => (float) $outMove->unit_cost,
                'type'         => 'transfer_in',
                'source_type'  => $params['source_type'] ?? null,
                'source_id'    => $params['source_id'] ?? null,
                'source_no'    => $params['source_no'] ?? null,
                'user_id'      => $params['user_id'] ?? auth()->id(),
                'remark'       => $params['remark'] ?? '调拨入库',
            ]);

            return [$outMove, $inMove];
        });
    }

    /**
     * 盘点调整：把系统数量直接调整到实盘数量
     * 差为正 → 入库（盘盈），负 → 出库（盘亏）
     */
    public function adjust(array $params): ?StockMovement
    {
        $this->validateParams($params, ['system_qty', 'actual_qty']);
        $diff = (float) $params['actual_qty'] - (float) $params['system_qty'];
        if (abs($diff) < 0.0001) return null;  // 无差异不动

        if ($diff > 0) {
            return $this->in([
                'warehouse_id' => $params['warehouse_id'],
                'product_id'   => $params['product_id'],
                'variant_id'   => $params['variant_id'] ?? null,
                'quantity'     => $diff,
                'unit_cost'    => $params['unit_cost'] ?? 0,
                'type'         => 'stocktake_adjust',
                'source_type'  => $params['source_type'] ?? null,
                'source_id'    => $params['source_id'] ?? null,
                'source_no'    => $params['source_no'] ?? null,
                'user_id'      => $params['user_id'] ?? auth()->id(),
                'remark'       => '盘盈',
            ]);
        }
        return $this->out([
            'warehouse_id' => $params['warehouse_id'],
            'product_id'   => $params['product_id'],
            'variant_id'   => $params['variant_id'] ?? null,
            'quantity'     => -$diff,
            'type'         => 'stocktake_adjust',
            'source_type'  => $params['source_type'] ?? null,
            'source_id'    => $params['source_id'] ?? null,
            'source_no'    => $params['source_no'] ?? null,
            'user_id'      => $params['user_id'] ?? auth()->id(),
            'remark'       => '盘亏',
        ]);
    }

    /**
     * 占用库存（销售下单时锁定）
     */
    public function reserve(array $params): bool
    {
        return DB::transaction(function () use ($params) {
            $stock = $this->lockStock($params);
            $available = (float) $stock->quantity - (float) $stock->reserved_quantity;
            if ($available < (float) $params['quantity'] && ! config('inventory.allow_negative_stock')) {
                throw new RuntimeException(sprintf('可用库存不足：可用 %.4f 需占 %.4f', $available, $params['quantity']));
            }
            $stock->increment('reserved_quantity', $params['quantity']);
            return true;
        });
    }

    /**
     * 释放占用（取消订单 / 出库后释放）
     */
    public function release(array $params): bool
    {
        return DB::transaction(function () use ($params) {
            $stock = $this->lockStock($params);
            $newReserved = max(0, (float) $stock->reserved_quantity - (float) $params['quantity']);
            $stock->update(['reserved_quantity' => $newReserved]);
            return true;
        });
    }

    /** 获取库存；依赖唯一键原子确保空记录存在，再取得行锁。 */
    protected function lockStock(array $params): Stock
    {
        $where = [
            'warehouse_id' => $params['warehouse_id'],
            'product_id'   => $params['product_id'],
            'variant_id'   => $params['variant_id'] ?? null,
        ];
        $now = now();
        Stock::query()->insertOrIgnore(array_merge($where, [
            'quantity' => 0,
            'reserved_quantity' => 0,
            'avg_cost' => 0,
            'created_at' => $now,
            'updated_at' => $now,
        ]));

        return Stock::where($where)->lockForUpdate()->firstOrFail();
    }

    protected function validateParams(array $params, array $required = []): void
    {
        $base = ['warehouse_id', 'product_id'];
        foreach (array_merge($base, $required) as $k) {
            if (! isset($params[$k])) throw new InvalidArgumentException("缺少参数: {$k}");
        }
    }
}
