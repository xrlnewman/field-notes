<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockTransfer;
use App\Services\OrderNoGenerator;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function __construct(protected StockService $stock) {}

    public function index(Request $r)
    {
        $q = StockTransfer::query()->with(['fromWarehouse:id,name', 'toWarehouse:id,name']);
        if ($r->filled('status')) $q->where('status', $r->status);
        return $this->ok($q->orderByDesc('id')->paginate($r->input('per_page', 20)));
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'from_warehouse_id' => 'required|integer|exists:warehouses,id|different:to_warehouse_id',
            'to_warehouse_id' => 'required|integer|exists:warehouses,id',
            'transfer_date' => 'nullable|date',
            'remark' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.product_name' => 'required|string|max:200',
            'items.*.quantity' => 'required|numeric|min:0.0001',
        ]);

        return DB::transaction(function () use ($data) {
            $transfer = StockTransfer::create([
                'order_no' => OrderNoGenerator::transfer(),
                'from_warehouse_id' => $data['from_warehouse_id'],
                'to_warehouse_id' => $data['to_warehouse_id'],
                'transfer_date' => $data['transfer_date'] ?? now()->toDateString(),
                'status' => 'draft',
                'total_quantity' => collect($data['items'])->sum('quantity'),
                'created_by' => auth()->id(),
                'remark' => $data['remark'] ?? null,
            ]);
            foreach ($data['items'] as $item) {
                $transfer->items()->create($item);
            }
            return $this->ok($transfer->load('items'));
        });
    }

    public function show(StockTransfer $stockTransfer)
    {
        return $this->ok($stockTransfer->load(['fromWarehouse', 'toWarehouse', 'items.product', 'creator:id,name']));
    }

    public function execute(StockTransfer $stockTransfer)
    {
        if ($stockTransfer->status !== 'draft') return $this->fail('只有草稿可以执行调拨');
        return DB::transaction(function () use ($stockTransfer) {
            foreach ($stockTransfer->items as $item) {
                $this->stock->transfer([
                    'from_warehouse_id' => $stockTransfer->from_warehouse_id,
                    'to_warehouse_id' => $stockTransfer->to_warehouse_id,
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->quantity,
                    'source_type' => StockTransfer::class,
                    'source_id' => $stockTransfer->id,
                    'source_no' => $stockTransfer->order_no,
                ]);
            }
            $stockTransfer->update([
                'status' => 'completed',
                'confirmed_by' => auth()->id(),
                'confirmed_at' => now(),
                'received_at' => now(),
            ]);
            return $this->ok($stockTransfer->fresh('items'));
        });
    }
}
