<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('variant_id')->nullable()->constrained('product_variants');
            $table->string('product_name', 200)->comment('快照');
            $table->string('product_code', 50)->nullable();
            $table->string('unit', 20)->nullable();
            $table->decimal('quantity', 18, 4);
            $table->decimal('received_quantity', 18, 4)->default(0)->comment('已入库数量');
            $table->decimal('unit_price', 14, 4);
            $table->decimal('tax_rate', 5, 2)->default(0)->comment('税率 %');
            $table->decimal('amount', 18, 2)->comment('不含税小计');
            $table->decimal('tax_amount', 18, 2)->default(0);
            $table->decimal('total', 18, 2)->comment('含税小计');
            $table->text('remark')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('purchase_order_items'); }
};
