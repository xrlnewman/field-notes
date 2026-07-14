<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('商品编码 / SPU');
            $table->string('name', 200)->comment('商品名称');
            $table->foreignId('category_id')->nullable();
            $table->string('brand', 100)->nullable();
            $table->string('unit', 20)->default('个')->comment('计量单位');
            $table->string('spec', 200)->nullable()->comment('规格描述');
            $table->string('barcode', 50)->nullable();
            $table->string('image')->nullable();
            $table->text('images')->nullable()->comment('多图 JSON');
            $table->text('description')->nullable();

            // 价格
            $table->decimal('cost_price', 14, 4)->default(0)->comment('成本价（参考/初始）');
            $table->decimal('purchase_price', 14, 4)->default(0)->comment('参考采购价');
            $table->decimal('sales_price', 14, 4)->default(0)->comment('销售价');
            $table->decimal('retail_price', 14, 4)->default(0)->comment('零售价');

            // 库存配置
            $table->decimal('safety_stock', 14, 4)->default(0)->comment('安全库存');
            $table->decimal('max_stock', 14, 4)->default(0)->comment('最大库存');

            $table->tinyInteger('has_sku')->default(0)->comment('1=多规格走 product_variants');
            $table->tinyInteger('status')->default(1);
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['category_id', 'status']);
            $table->index('name');
            $table->index('barcode');
        });
    }

    public function down(): void { Schema::dropIfExists('products'); }
};
