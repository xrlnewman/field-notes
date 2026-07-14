<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no', 50)->unique();
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->date('order_date');
            $table->date('expected_date')->nullable();
            $table->string('status', 30)->default('draft')->comment('draft/confirmed/shipped/completed/cancelled');

            $table->decimal('total_quantity', 18, 4)->default(0);
            $table->decimal('total_amount', 18, 2)->default(0);
            $table->decimal('tax_amount', 18, 2)->default(0);
            $table->decimal('discount_amount', 18, 2)->default(0);
            $table->decimal('grand_total', 18, 2)->default(0);
            $table->decimal('cost_total', 18, 2)->default(0)->comment('成本汇总');
            $table->decimal('paid_amount', 18, 2)->default(0);

            $table->string('payment_method', 30)->nullable();
            $table->string('payment_status', 20)->default('unpaid');

            $table->foreignId('salesman_id')->nullable()->comment('销售员 user_id');
            $table->foreignId('created_by')->nullable();
            $table->foreignId('confirmed_by')->nullable();
            $table->foreignId('shipped_by')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('shipped_at')->nullable();

            $table->string('ship_address')->nullable();
            $table->string('ship_contact', 100)->nullable();
            $table->string('ship_phone', 30)->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['customer_id', 'order_date']);
            $table->index('status');
            $table->index('salesman_id');
        });
    }

    public function down(): void { Schema::dropIfExists('sales_orders'); }
};
