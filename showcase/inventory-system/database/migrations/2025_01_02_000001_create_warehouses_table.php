<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('仓库编码');
            $table->string('name', 100)->comment('仓库名称');
            $table->string('address')->nullable();
            $table->string('contact_name', 50)->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->foreignId('manager_id')->nullable()->comment('负责人 user_id');
            $table->tinyInteger('is_default')->default(0)->comment('1=默认仓库');
            $table->tinyInteger('status')->default(1);
            $table->integer('sort_order')->default(0);
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void { Schema::dropIfExists('warehouses'); }
};
