<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\PurchaseService;
use Illuminate\Http\Request;

class PurchaseOrderController extends Controller
{
    public function __construct(protected PurchaseService $svc) {}

    public function index(Request $r)
    {
        $q = PurchaseOrder::query()->with(['supplier:id,name', 'warehouse:id,name']);
        if ($r->filled('keyword')) $q->where('order_no', 'like', "%{$r->keyword}%");
        if ($r->filled('supplier_id')) $q->where('supplier_id', $r->supplier_id);
        if ($r->filled('warehouse_id')) $q->where('warehouse_id', $r->warehouse_id);
        if ($r->filled('status')) $q->where('status', $r->status);
        if ($r->filled('start_date')) $q->where('order_date', '>=', $r->start_date);
        if ($r->filled('end_date')) $q->where('order_date', '<=', $r->end_date);
        return $this->ok($q->orderByDesc('id')->paginate($r->input('per_page', 20)));
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'order_date' => 'nullable|date',
            'expected_date' => 'nullable|date',
            'remark' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.product_name' => 'required|string|max:200',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);
        return $this->ok($this->svc->create($data));
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return $this->ok($purchaseOrder->load(['supplier', 'warehouse', 'items.product', 'items.variant', 'creator:id,name', 'confirmer:id,name', 'receiver:id,name']));
    }

    public function confirm(PurchaseOrder $purchaseOrder) { return $this->ok($this->svc->confirm($purchaseOrder)); }
    public function receive(PurchaseOrder $purchaseOrder) { return $this->ok($this->svc->receive($purchaseOrder)); }

    public function cancel(Request $r, PurchaseOrder $purchaseOrder)
    {
        return $this->ok($this->svc->cancel($purchaseOrder, $r->input('reason')));
    }
}
