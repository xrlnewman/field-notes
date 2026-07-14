<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\SalesOrder;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /** 仪表盘 KPI */
    public function dashboard(Request $r)
    {
        $today = now()->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        return $this->ok([
            'today_sales' => SalesOrder::where('order_date', $today)->where('status', '!=', 'cancelled')->sum('grand_total'),
            'today_purchase' => PurchaseOrder::where('order_date', $today)->where('status', '!=', 'cancelled')->sum('grand_total'),
            'month_sales' => SalesOrder::whereBetween('order_date', [$monthStart, $monthEnd])->where('status', '!=', 'cancelled')->sum('grand_total'),
            'month_purchase' => PurchaseOrder::whereBetween('order_date', [$monthStart, $monthEnd])->where('status', '!=', 'cancelled')->sum('grand_total'),
            'month_profit' => (float) SalesOrder::whereBetween('order_date', [$monthStart, $monthEnd])->where('status', 'completed')->sum(DB::raw('grand_total - cost_total')),
            'total_stock_value' => (float) Stock::query()->sum(DB::raw('quantity * avg_cost')),
            'low_stock_count' => Stock::query()->join('products', 'stocks.product_id', '=', 'products.id')
                ->whereColumn('stocks.quantity', '<', 'products.safety_stock')
                ->where('products.safety_stock', '>', 0)->count(),
        ]);
    }

    /** 销售报表（按客户/商品/日期分组） */
    public function salesReport(Request $r)
    {
        $r->validate([
            'group_by' => 'required|in:customer,product,salesman,date',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);
        $q = SalesOrder::query()
            ->where('status', '!=', 'cancelled')
            ->whereBetween('order_date', [$r->start_date, $r->end_date]);
        if ($r->filled('warehouse_id')) $q->where('warehouse_id', $r->warehouse_id);

        switch ($r->group_by) {
            case 'customer':
                return $this->ok($q->select('customer_id', DB::raw('count(*) order_count'), DB::raw('sum(grand_total) total'), DB::raw('sum(grand_total - cost_total) profit'))
                    ->groupBy('customer_id')->with('customer:id,name')->orderByDesc('total')->get());
            case 'salesman':
                return $this->ok($q->select('salesman_id', DB::raw('count(*) order_count'), DB::raw('sum(grand_total) total'), DB::raw('sum(grand_total - cost_total) profit'))
                    ->groupBy('salesman_id')->with('salesman:id,name')->orderByDesc('total')->get());
            case 'date':
                return $this->ok($q->select(DB::raw('order_date'), DB::raw('count(*) order_count'), DB::raw('sum(grand_total) total'), DB::raw('sum(grand_total - cost_total) profit'))
                    ->groupBy('order_date')->orderBy('order_date')->get());
            case 'product':
                return $this->ok(DB::table('sales_order_items as i')
                    ->join('sales_orders as o', 'i.sales_order_id', '=', 'o.id')
                    ->whereBetween('o.order_date', [$r->start_date, $r->end_date])
                    ->where('o.status', '!=', 'cancelled')
                    ->select('i.product_id', 'i.product_name',
                        DB::raw('sum(i.quantity) total_qty'),
                        DB::raw('sum(i.total) total_sales'),
                        DB::raw('sum(i.unit_cost * i.quantity) total_cost'))
                    ->groupBy('i.product_id', 'i.product_name')
                    ->orderByDesc('total_sales')
                    ->limit(1000)->get());
        }
    }

    /** 采购报表 */
    public function purchaseReport(Request $r)
    {
        $r->validate(['group_by' => 'required|in:supplier,product,date', 'start_date' => 'required|date', 'end_date' => 'required|date']);
        $q = PurchaseOrder::where('status', '!=', 'cancelled')->whereBetween('order_date', [$r->start_date, $r->end_date]);
        if ($r->group_by === 'supplier') {
            return $this->ok($q->select('supplier_id', DB::raw('count(*) order_count'), DB::raw('sum(grand_total) total'))
                ->groupBy('supplier_id')->with('supplier:id,name')->orderByDesc('total')->get());
        }
        if ($r->group_by === 'date') {
            return $this->ok($q->select(DB::raw('order_date'), DB::raw('count(*) order_count'), DB::raw('sum(grand_total) total'))
                ->groupBy('order_date')->orderBy('order_date')->get());
        }
        return $this->ok(DB::table('purchase_order_items as i')
            ->join('purchase_orders as o', 'i.purchase_order_id', '=', 'o.id')
            ->whereBetween('o.order_date', [$r->start_date, $r->end_date])
            ->where('o.status', '!=', 'cancelled')
            ->select('i.product_id', 'i.product_name', DB::raw('sum(i.quantity) total_qty'), DB::raw('sum(i.total) total_amount'))
            ->groupBy('i.product_id', 'i.product_name')->orderByDesc('total_amount')->limit(1000)->get());
    }

    /** 库存账（按商品/仓库的当前库存价值汇总） */
    public function stockReport(Request $r)
    {
        $q = Stock::query()
            ->select('product_id', DB::raw('sum(quantity) total_qty'), DB::raw('avg(avg_cost) avg_cost'), DB::raw('sum(quantity * avg_cost) total_value'))
            ->groupBy('product_id')
            ->with('product:id,name,code,unit,safety_stock');
        if ($r->filled('warehouse_id')) $q->where('warehouse_id', $r->warehouse_id);
        return $this->ok($q->orderByDesc('total_value')->paginate($r->input('per_page', 50)));
    }

    /** 利润报表（按月） */
    public function profitReport(Request $r)
    {
        $r->validate(['start_date' => 'required|date', 'end_date' => 'required|date']);
        return $this->ok(SalesOrder::where('status', 'completed')
            ->whereBetween('order_date', [$r->start_date, $r->end_date])
            ->select(DB::raw("DATE_FORMAT(order_date, '%Y-%m') ym"),
                DB::raw('sum(grand_total) revenue'),
                DB::raw('sum(cost_total) cost'),
                DB::raw('sum(grand_total - cost_total) profit'))
            ->groupBy('ym')->orderBy('ym')->get());
    }
}
