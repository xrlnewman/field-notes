<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function __construct(protected StockService $stock) {}

    /**
     * 创建采购单（草稿）
     */
    public function create(array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($data) {
            $order = PurchaseOrder::create([
                'order_no' => OrderNoGenerator::purchase(),
                'supplier_id' => $data['supplier_id'],
                'warehouse_id' => $data['warehouse_id'],
                'order_date' => $data['order_date'] ?? now()->toDateString(),
                'expected_date' => $data['expected_date'] ?? null,
                'status' => PurchaseOrder::STATUS_DRAFT,
                'created_by' => auth()->id(),
                'remark' => $data['remark'] ?? null,
            ]);

            $totalQty = 0; $totalAmount = 0; $taxAmount = 0;
            foreach ($data['items'] as $item) {
                $unitPrice = (float) $item['unit_price'];
                $qty = (float) $item['quantity'];
                $taxRate = (float) ($item['tax_rate'] ?? 0);
                $amount = round($qty * $unitPrice, 2);
                $tax = round($amount * $taxRate / 100, 2);
                $total = $amount + $tax;
                $totalQty += $qty;
                $totalAmount += $amount;
                $taxAmount += $tax;

                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'product_code' => $item['product_code'] ?? null,
                    'unit' => $item['unit'] ?? null,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'tax_rate' => $taxRate,
                    'amount' => $amount,
                    'tax_amount' => $tax,
                    'total' => $total,
                    'remark' => $item['remark'] ?? null,
                ]);
            }

            $order->update([
                'total_quantity' => $totalQty,
                'total_amount' => $totalAmount,
                'tax_amount' => $taxAmount,
                'grand_total' => $totalAmount + $taxAmount,
            ]);

            return $order->load('items');
        });
    }

    /**
     * 确认采购单（草稿→已确认，仅状态变更，未入库）
     */
    public function confirm(PurchaseOrder $order): PurchaseOrder
    {
        return DB::transaction(function () use ($order) {
            $order = PurchaseOrder::query()->lockForUpdate()->findOrFail($order->id);
            if ($order->status !== PurchaseOrder::STATUS_DRAFT) {
                throw new \RuntimeException('只有草稿状态可以确认');
            }
            $order->update([
                'status' => PurchaseOrder::STATUS_CONFIRMED,
                'confirmed_by' => auth()->id(),
                'confirmed_at' => now(),
            ]);
            return $order;
        });
    }

    /**
     * 收货入库（已确认→已入库，触发库存增加 + 应付增加）
     */
    public function receive(PurchaseOrder $order): PurchaseOrder
    {
        return DB::transaction(function () use ($order) {
            $order = PurchaseOrder::query()->lockForUpdate()->findOrFail($order->id);
            if ($order->status !== PurchaseOrder::STATUS_CONFIRMED) {
                throw new \RuntimeException('只有已确认状态可以收货');
            }

            foreach ($order->items as $item) {
                $this->stock->in([
                    'warehouse_id' => $order->warehouse_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'unit_cost' => (float) $item->unit_price,
                    'type' => 'purchase_in',
                    'source_type' => PurchaseOrder::class,
                    'source_id' => $order->id,
                    'source_no' => $order->order_no,
                    'remark' => '采购入库',
                ]);
                $item->update(['received_quantity' => $item->quantity]);
            }

            $order->update([
                'status' => PurchaseOrder::STATUS_RECEIVED,
                'received_by' => auth()->id(),
                'received_at' => now(),
            ]);

            // 应付增加
            Supplier::where('id', $order->supplier_id)->increment('current_balance', $order->grand_total);

            return $order->fresh('items');
        });
    }

    public function cancel(PurchaseOrder $order, ?string $reason = null): PurchaseOrder
    {
        return DB::transaction(function () use ($order, $reason) {
            $order = PurchaseOrder::query()->lockForUpdate()->findOrFail($order->id);
            if (! in_array($order->status, [PurchaseOrder::STATUS_DRAFT, PurchaseOrder::STATUS_CONFIRMED], true)) {
                throw new \RuntimeException('只有草稿或已确认状态可以取消');
            }
            $order->update([
                'status' => PurchaseOrder::STATUS_CANCELLED,
                'remark' => trim(($order->remark ?? '') . "\n[取消] " . ($reason ?? '')),
            ]);
            return $order;
        });
    }
}
