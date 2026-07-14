<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('variant_id')->nullable()->constrained('product_variants');
            $table->string('type', 30)->comment('purchase_in/sales_out/transfer_in/transfer_out/stocktake_adjust/stock_in/stock_out');
            $table->decimal('quantity', 18, 4)->comment('+ 入库 / - 出库');
            $table->decimal('unit_cost', 14, 6)->default(0);
            $table->decimal('total_cost', 18, 4)->default(0);
            $table->decimal('quantity_before', 18, 4)->default(0);
            $table->decimal('quantity_after', 18, 4)->default(0);
            $table->string('source_type', 50)->nullable()->comment('PurchaseOrder/SalesOrder/StockTransfer/StockTake');
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('source_no', 50)->nullable()->comment('源单号便于查询');
            $table->foreignId('user_id')->nullable()->comment('操作人');
            $table->text('remark')->nullable();
            $table->timestamps();

            $table->index(['warehouse_id', 'product_id', 'created_at']);
            $table->index(['source_type', 'source_id']);
            $table->index('type');
        });
    }

    public function down(): void { Schema::dropIfExists('stock_movements'); }
};
