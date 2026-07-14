<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->comment('父级，支持树形');
            $table->string('name', 100);
            $table->string('code', 50)->nullable();
            $table->integer('sort_order')->default(0);
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
            $table->index('parent_id');
        });
    }

    public function down(): void { Schema::dropIfExists('product_categories'); }
};
