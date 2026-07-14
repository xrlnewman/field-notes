<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Services\SalesService;
use Illuminate\Http\Request;

class SalesOrderController extends Controller
{
    public function __construct(protected SalesService $svc) {}

    public function index(Request $r)
    {
        $q = SalesOrder::query()->with(['customer:id,name', 'warehouse:id,name', 'salesman:id,name']);
        if ($r->filled('keyword')) $q->where('order_no', 'like', "%{$r->keyword}%");
        if ($r->filled('customer_id')) $q->where('customer_id', $r->customer_id);
        if ($r->filled('warehouse_id')) $q->where('warehouse_id', $r->warehouse_id);
        if ($r->filled('salesman_id')) $q->where('salesman_id', $r->salesman_id);
        if ($r->filled('status')) $q->where('status', $r->status);
        if ($r->filled('start_date')) $q->where('order_date', '>=', $r->start_date);
        if ($r->filled('end_date')) $q->where('order_date', '<=', $r->end_date);
        return $this->ok($q->orderByDesc('id')->paginate($r->input('per_page', 20)));
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'customer_id' => 'required|integer|exists:customers,id',
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'order_date' => 'nullable|date',
            'expected_date' => 'nullable|date',
            'salesman_id' => 'nullable|integer|exists:users,id',
            'ship_address' => 'nullable|string',
            'ship_contact' => 'nullable|string|max:100',
            'ship_phone' => 'nullable|string|max:30',
            'discount_amount' => 'nullable|numeric|min:0',
            'remark' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.product_name' => 'required|string|max:200',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);
        return $this->ok($this->svc->create($data));
    }

    public function show(SalesOrder $salesOrder)
    {
        return $this->ok($salesOrder->load(['customer', 'warehouse', 'items.product', 'items.variant', 'creator:id,name', 'salesman:id,name', 'shipper:id,name']));
    }

    public function confirm(SalesOrder $salesOrder) { return $this->ok($this->svc->confirm($salesOrder)); }
    public function ship(SalesOrder $salesOrder)    { return $this->ok($this->svc->ship($salesOrder)); }
    public function complete(SalesOrder $salesOrder){ return $this->ok($this->svc->complete($salesOrder)); }
    public function cancel(Request $r, SalesOrder $salesOrder)
    {
        return $this->ok($this->svc->cancel($salesOrder, $r->input('reason')));
    }
}
