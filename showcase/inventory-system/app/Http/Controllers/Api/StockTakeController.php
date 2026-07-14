<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Models\StockTake;
use App\Services\OrderNoGenerator;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTakeController extends Controller
{
    public function __construct(protected StockService $stock) {}

    public function index(Request $r)
    {
        $q = StockTake::with('warehouse:id,name');
        if ($r->filled('warehouse_id')) $q->where('warehouse_id', $r->warehouse_id);
        if ($r->filled('status')) $q->where('status', $r->status);
        return $this->ok($q->orderByDesc('id')->paginate($r->input('per_page', 20)));
    }

    /** 创建盘点单：自动锁定当前库存为系统数 */
    public function store(Request $r)
    {
        $data = $r->validate([
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'take_date' => 'nullable|date',
            'remark' => 'nullable|string',
        ]);
        return DB::transaction(function () use ($data) {
            $take = StockTake::create([
                'order_no' => OrderNoGenerator::stocktake(),
                'warehouse_id' => $data['warehouse_id'],
                'take_date' => $data['take_date'] ?? now()->toDateString(),
                'status' => 'in_progress',
                'created_by' => auth()->id(),
                'remark' => $data['remark'] ?? null,
            ]);
            // 锁定当前所有库存为基线
            $stocks = Stock::where('warehouse_id', $data['warehouse_id'])->with('product:id,name')->get();
            foreach ($stocks as $s) {
                $take->items()->create([
                    'product_id' => $s->product_id,
                    'variant_id' => $s->variant_id,
                    'product_name' => $s->product?->name ?? '',
                    'system_qty' => $s->quantity,
                    'actual_qty' => $s->quantity,
                ]);
            }
            $take->update(['item_count' => $stocks->count()]);
            return $this->ok($take->load('items'));
        });
    }

    public function show(StockTake $stockTake)
    {
        return $this->ok($stockTake->load(['warehouse', 'items.product', 'creator:id,name']));
    }

    /** 提交实盘数据（按 item 数组） */
    public function update(Request $r, StockTake $stockTake)
    {
        if ($stockTake->status !== 'in_progress') return $this->fail('盘点单非进行中');
        $data = $r->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer|exists:stock_take_items,id',
            'items.*.actual_qty' => 'required|numeric|min:0',
            'items.*.remark' => 'nullable|string',
        ]);
        foreach ($data['items'] as $item) {
            \App\Models\StockTakeItem::where('id', $item['id'])
                ->where('stock_take_id', $stockTake->id)
                ->update(['actual_qty' => $item['actual_qty'], 'remark' => $item['remark'] ?? null]);
        }
        $diffCount = $stockTake->items()->whereColumn('actual_qty', '!=', 'system_qty')->count();
        $stockTake->update(['diff_count' => $diffCount]);
        return $this->ok($stockTake->fresh('items'));
    }

    /** 完成盘点：触发差异调整 */
    public function complete(StockTake $stockTake)
    {
        if ($stockTake->status !== 'in_progress') return $this->fail('状态错误');
        return DB::transaction(function () use ($stockTake) {
            foreach ($stockTake->items as $item) {
                if (abs((float)$item->actual_qty - (float)$item->system_qty) < 0.0001) continue;
                $this->stock->adjust([
                    'warehouse_id' => $stockTake->warehouse_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'system_qty' => $item->system_qty,
                    'actual_qty' => $item->actual_qty,
                    'source_type' => StockTake::class,
                    'source_id' => $stockTake->id,
                    'source_no' => $stockTake->order_no,
                ]);
            }
            $stockTake->update([
                'status' => 'completed',
                'completed_by' => auth()->id(),
                'completed_at' => now(),
            ]);
            return $this->ok($stockTake);
        });
    }
}
