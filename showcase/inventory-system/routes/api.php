<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SalesOrderController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\StockTakeController;
use App\Http\Controllers\Api\StockTransferController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\WarehouseController;
use Illuminate\Support\Facades\Route;

// 公开
Route::post('/auth/login', [AuthController::class, 'login']);

// 需登录
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // 基础数据
    Route::apiResource('warehouses', WarehouseController::class);
    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('customers', CustomerController::class);

    // 商品
    Route::get('products/category-tree', [ProductController::class, 'categoryTree']);
    Route::apiResource('products', ProductController::class);

    // 库存
    Route::get('stocks', [StockController::class, 'index']);
    Route::get('stocks/movements', [StockController::class, 'movements']);
    Route::get('stocks/low-stock', [StockController::class, 'lowStock']);
    Route::post('stocks/manual-in', [StockController::class, 'manualIn']);
    Route::post('stocks/manual-out', [StockController::class, 'manualOut']);

    // 采购
    Route::apiResource('purchase-orders', PurchaseOrderController::class)->except(['update', 'destroy']);
    Route::post('purchase-orders/{purchaseOrder}/confirm', [PurchaseOrderController::class, 'confirm']);
    Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
    Route::post('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel']);

    // 销售
    Route::apiResource('sales-orders', SalesOrderController::class)->except(['update', 'destroy']);
    Route::post('sales-orders/{salesOrder}/confirm', [SalesOrderController::class, 'confirm']);
    Route::post('sales-orders/{salesOrder}/ship', [SalesOrderController::class, 'ship']);
    Route::post('sales-orders/{salesOrder}/complete', [SalesOrderController::class, 'complete']);
    Route::post('sales-orders/{salesOrder}/cancel', [SalesOrderController::class, 'cancel']);

    // 调拨
    Route::apiResource('stock-transfers', StockTransferController::class)->only(['index', 'store', 'show']);
    Route::post('stock-transfers/{stockTransfer}/execute', [StockTransferController::class, 'execute']);

    // 盘点
    Route::apiResource('stock-takes', StockTakeController::class)->only(['index', 'store', 'show', 'update']);
    Route::post('stock-takes/{stockTake}/complete', [StockTakeController::class, 'complete']);

    // 报表
    Route::get('reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('reports/sales', [ReportController::class, 'salesReport']);
    Route::get('reports/purchase', [ReportController::class, 'purchaseReport']);
    Route::get('reports/stock', [ReportController::class, 'stockReport']);
    Route::get('reports/profit', [ReportController::class, 'profitReport']);
});
