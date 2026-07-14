<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('sku', 80)->unique()->comment('SKU 编码');
            $table->string('barcode', 50)->nullable();
            $table->json('attributes')->nullable()->comment('规格属性 {颜色:红, 尺寸:L}');
            $table->string('image')->nullable();
            $table->decimal('cost_price', 14, 4)->default(0);
            $table->decimal('purchase_price', 14, 4)->default(0);
            $table->decimal('sales_price', 14, 4)->default(0);
            $table->decimal('retail_price', 14, 4)->default(0);
            $table->decimal('safety_stock', 14, 4)->default(0);
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
            $table->index('barcode');
        });
    }

    public function down(): void { Schema::dropIfExists('product_variants'); }
};
