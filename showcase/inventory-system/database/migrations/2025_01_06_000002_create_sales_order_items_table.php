<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('variant_id')->nullable()->constrained('product_variants');
            $table->string('product_name', 200);
            $table->string('product_code', 50)->nullable();
            $table->string('unit', 20)->nullable();
            $table->decimal('quantity', 18, 4);
            $table->decimal('shipped_quantity', 18, 4)->default(0);
            $table->decimal('unit_price', 14, 4);
            $table->decimal('unit_cost', 14, 4)->default(0)->comment('出库时记录的成本');
            $table->decimal('discount', 5, 2)->default(0)->comment('折扣 %');
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('amount', 18, 2);
            $table->decimal('tax_amount', 18, 2)->default(0);
            $table->decimal('total', 18, 2);
            $table->text('remark')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('sales_order_items'); }
};
