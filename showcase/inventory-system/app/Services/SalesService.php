<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\SalesOrder;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;

class SalesService
{
    public function __construct(protected StockService $stock) {}

    public function create(array $data): SalesOrder
    {
        return DB::transaction(function () use ($data) {
            $order = SalesOrder::create([
                'order_no' => OrderNoGenerator::sales(),
                'customer_id' => $data['customer_id'],
                'warehouse_id' => $data['warehouse_id'],
                'order_date' => $data['order_date'] ?? now()->toDateString(),
                'expected_date' => $data['expected_date'] ?? null,
                'status' => SalesOrder::STATUS_DRAFT,
                'salesman_id' => $data['salesman_id'] ?? auth()->id(),
                'created_by' => auth()->id(),
                'ship_address' => $data['ship_address'] ?? null,
                'ship_contact' => $data['ship_contact'] ?? null,
                'ship_phone' => $data['ship_phone'] ?? null,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'remark' => $data['remark'] ?? null,
            ]);

            $totalQty = 0; $totalAmount = 0; $taxAmount = 0;
            foreach ($data['items'] as $item) {
                $unitPrice = (float) $item['unit_price'];
                $qty = (float) $item['quantity'];
                $taxRate = (float) ($item['tax_rate'] ?? 0);
                $discount = (float) ($item['discount'] ?? 0);
                $amount = round($qty * $unitPrice * (1 - $discount / 100), 2);
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
                    'discount' => $discount,
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
                'grand_total' => $totalAmount + $taxAmount - (float) $order->discount_amount,
            ]);

            return $order->load('items');
        });
    }

    /**
     * 确认 + 占用库存
     */
    public function confirm(SalesOrder $order): SalesOrder
    {
        return DB::transaction(function () use ($order) {
            $order = SalesOrder::query()->lockForUpdate()->findOrFail($order->id);
            if ($order->status !== SalesOrder::STATUS_DRAFT) {
                throw new \RuntimeException('只有草稿状态可以确认');
            }

            foreach ($order->items as $item) {
                $this->stock->reserve([
                    'warehouse_id' => $order->warehouse_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                ]);
            }
            $order->update([
                'status' => SalesOrder::STATUS_CONFIRMED,
                'confirmed_by' => auth()->id(),
                'confirmed_at' => now(),
            ]);
            return $order;
        });
    }

    /**
     * 发货：真正出库，结转销售成本
     */
    public function ship(SalesOrder $order): SalesOrder
    {
        return DB::transaction(function () use ($order) {
            $order = SalesOrder::query()->lockForUpdate()->findOrFail($order->id);
            if ($order->status !== SalesOrder::STATUS_CONFIRMED) {
                throw new \RuntimeException('只有已确认状态可以发货');
            }

            $costTotal = 0;
            foreach ($order->items as $item) {
                // 释放占用（如果之前 reserve 过）
                if ($order->status === SalesOrder::STATUS_CONFIRMED) {
                    $this->stock->release([
                        'warehouse_id' => $order->warehouse_id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'quantity' => $item->quantity,
                    ]);
                }
                // 出库
                $movement = $this->stock->out([
                    'warehouse_id' => $order->warehouse_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'type' => 'sales_out',
                    'source_type' => SalesOrder::class,
                    'source_id' => $order->id,
                    'source_no' => $order->order_no,
                    'remark' => '销售出库',
                ]);
                $unitCost = (float) $movement->unit_cost;
                $item->update([
                    'shipped_quantity' => $item->quantity,
                    'unit_cost' => $unitCost,
                ]);
                $costTotal += $unitCost * (float) $item->quantity;
            }

            $order->update([
                'status' => SalesOrder::STATUS_SHIPPED,
                'shipped_by' => auth()->id(),
                'shipped_at' => now(),
                'cost_total' => $costTotal,
            ]);

            // 应收增加
            Customer::where('id', $order->customer_id)->increment('current_balance', $order->grand_total);

            return $order->fresh('items');
        });
    }

    public function complete(SalesOrder $order): SalesOrder
    {
        return DB::transaction(function () use ($order) {
            $order = SalesOrder::query()->lockForUpdate()->findOrFail($order->id);
            if ($order->status !== SalesOrder::STATUS_SHIPPED) {
                throw new \RuntimeException('只能完成已发货状态的单');
            }
            $order->update(['status' => SalesOrder::STATUS_COMPLETED]);
            return $order;
        });
    }

    public function cancel(SalesOrder $order, ?string $reason = null): SalesOrder
    {
        return DB::transaction(function () use ($order, $reason) {
            $order = SalesOrder::query()->lockForUpdate()->findOrFail($order->id);
            if (! in_array($order->status, [SalesOrder::STATUS_DRAFT, SalesOrder::STATUS_CONFIRMED], true)) {
                throw new \RuntimeException('只有草稿或已确认状态可以取消');
            }

            // 如果已经占用过库存，要释放
            if ($order->status === SalesOrder::STATUS_CONFIRMED) {
                foreach ($order->items as $item) {
                    $this->stock->release([
                        'warehouse_id' => $order->warehouse_id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'quantity' => $item->quantity,
                    ]);
                }
            }
            $order->update([
                'status' => SalesOrder::STATUS_CANCELLED,
                'remark' => trim(($order->remark ?? '') . "\n[取消] " . ($reason ?? '')),
            ]);
            return $order;
        });
    }
}
