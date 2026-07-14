<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function __construct(protected StockService $svc) {}

    /** 库存列表（按仓库×商品×SKU 维度） */
    public function index(Request $r)
    {
        $q = Stock::query()->with(['warehouse:id,name', 'product:id,name,code,unit,safety_stock', 'variant:id,sku,attributes']);
        if ($r->filled('warehouse_id')) $q->where('warehouse_id', $r->warehouse_id);
        if ($r->filled('product_id')) $q->where('product_id', $r->product_id);
        if ($r->filled('keyword')) {
            $kw = $r->keyword;
            $q->whereHas('product', fn($qq) => $qq->where('name', 'like', "%$kw%")->orWhere('code', 'like', "%$kw%"));
        }
        if ($r->boolean('low_stock')) {
            $q->join('products', 'stocks.product_id', '=', 'products.id')
              ->whereColumn('stocks.quantity', '<', 'products.safety_stock')
              ->select('stocks.*');
        }
        return $this->ok($q->orderByDesc('id')->paginate($r->input('per_page', 30)));
    }

    /** 库存流水 */
    public function movements(Request $r)
    {
        $q = StockMovement::query()->with(['warehouse:id,name', 'product:id,name,code', 'user:id,name']);
        if ($r->filled('warehouse_id')) $q->where('warehouse_id', $r->warehouse_id);
        if ($r->filled('product_id')) $q->where('product_id', $r->product_id);
        if ($r->filled('type')) $q->where('type', $r->type);
        if ($r->filled('source_no')) $q->where('source_no', $r->source_no);
        if ($r->filled('start_date')) $q->where('created_at', '>=', $r->start_date);
        if ($r->filled('end_date')) $q->where('created_at', '<=', $r->end_date . ' 23:59:59');
        return $this->ok($q->orderByDesc('id')->paginate($r->input('per_page', 50)));
    }

    /** 库存预警（低于安全库存） */
    public function lowStock(Request $r)
    {
        $q = Stock::query()
            ->join('products', 'stocks.product_id', '=', 'products.id')
            ->whereColumn('stocks.quantity', '<', 'products.safety_stock')
            ->where('products.safety_stock', '>', 0)
            ->select('stocks.*', 'products.name as product_name', 'products.code as product_code', 'products.safety_stock')
            ->with('warehouse:id,name');
        if ($r->filled('warehouse_id')) $q->where('stocks.warehouse_id', $r->warehouse_id);
        return $this->ok($q->paginate($r->input('per_page', 30)));
    }

    /** 其它入库（盘盈/手工入库等） */
    public function manualIn(Request $r)
    {
        $data = $r->validate([
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'product_id' => 'required|integer|exists:products,id',
            'variant_id' => 'nullable|integer|exists:product_variants,id',
            'quantity' => 'required|numeric|min:0.0001',
            'unit_cost' => 'required|numeric|min:0',
            'remark' => 'nullable|string',
        ]);
        $data['type'] = 'stock_in';
        $data['source_no'] = \App\Services\OrderNoGenerator::stockIn();
        $mv = $this->svc->in($data);
        return $this->ok($mv);
    }

    /** 其它出库 */
    public function manualOut(Request $r)
    {
        $data = $r->validate([
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'product_id' => 'required|integer|exists:products,id',
            'variant_id' => 'nullable|integer|exists:product_variants,id',
            'quantity' => 'required|numeric|min:0.0001',
            'remark' => 'nullable|string',
        ]);
        $data['type'] = 'stock_out';
        $data['source_no'] = \App\Services\OrderNoGenerator::stockOut();
        $mv = $this->svc->out($data);
        return $this->ok($mv);
    }
}
