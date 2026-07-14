<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('variant_id')->nullable()->constrained('product_variants');
            $table->unsignedBigInteger('variant_key')->storedAs('COALESCE(variant_id, 0)');
            $table->decimal('quantity', 18, 4)->default(0)->comment('在库数量');
            $table->decimal('reserved_quantity', 18, 4)->default(0)->comment('占用数量（已下单未发货）');
            $table->decimal('avg_cost', 14, 6)->default(0)->comment('加权平均成本');
            $table->timestamps();

            $table->unique(['warehouse_id', 'product_id', 'variant_key'], 'uniq_warehouse_product_variant');
            $table->index('product_id');
        });
    }

    public function down(): void { Schema::dropIfExists('stocks'); }
};
