<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no', 50)->unique()->comment('单号');
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->date('order_date');
            $table->date('expected_date')->nullable()->comment('预计到货日');
            $table->string('status', 30)->default('draft')->comment('draft 草稿 / confirmed 已确认 / received 已入库 / cancelled 已取消');

            $table->decimal('total_quantity', 18, 4)->default(0);
            $table->decimal('total_amount', 18, 2)->default(0)->comment('不含税');
            $table->decimal('tax_amount', 18, 2)->default(0);
            $table->decimal('grand_total', 18, 2)->default(0)->comment('含税');
            $table->decimal('paid_amount', 18, 2)->default(0)->comment('已付款');

            $table->string('payment_method', 30)->nullable();
            $table->string('payment_status', 20)->default('unpaid')->comment('unpaid/partial/paid');

            $table->foreignId('created_by')->nullable();
            $table->foreignId('confirmed_by')->nullable();
            $table->foreignId('received_by')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('received_at')->nullable();

            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['supplier_id', 'order_date']);
            $table->index('status');
        });
    }

    public function down(): void { Schema::dropIfExists('purchase_orders'); }
};
