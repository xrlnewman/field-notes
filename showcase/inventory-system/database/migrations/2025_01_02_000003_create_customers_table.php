<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('客户编码');
            $table->string('name', 100)->comment('客户名称');
            $table->string('contact_name', 50)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('address')->nullable();
            $table->string('tax_no', 30)->nullable();
            $table->string('level', 20)->nullable()->comment('客户等级');
            $table->decimal('credit_limit', 14, 2)->default(0);
            $table->decimal('current_balance', 14, 2)->default(0)->comment('当前应收');
            $table->tinyInteger('status')->default(1);
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('name');
        });
    }

    public function down(): void { Schema::dropIfExists('customers'); }
};
