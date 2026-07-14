<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_takes', function (Blueprint $table) {
            $table->id();
            $table->string('order_no', 50)->unique();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->date('take_date');
            $table->string('status', 30)->default('draft')->comment('draft/in_progress/completed/cancelled');
            $table->integer('item_count')->default(0);
            $table->integer('diff_count')->default(0)->comment('差异项数');
            $table->foreignId('created_by')->nullable();
            $table->foreignId('completed_by')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('stock_take_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_take_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('variant_id')->nullable()->constrained('product_variants');
            $table->string('product_name', 200);
            $table->decimal('system_qty', 18, 4)->comment('系统库存');
            $table->decimal('actual_qty', 18, 4)->comment('实盘');
            $table->decimal('diff_qty', 18, 4)->storedAs('actual_qty - system_qty');
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->unique(['stock_take_id', 'product_id', 'variant_id'], 'uniq_st_pv');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_take_items');
        Schema::dropIfExists('stock_takes');
    }
};
