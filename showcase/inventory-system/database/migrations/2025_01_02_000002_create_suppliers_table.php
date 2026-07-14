<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('供应商编码');
            $table->string('name', 100)->comment('供应商名称');
            $table->string('contact_name', 50)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('address')->nullable();
            $table->string('tax_no', 30)->nullable()->comment('税号');
            $table->string('bank_name', 100)->nullable();
            $table->string('bank_account', 50)->nullable();
            $table->decimal('credit_limit', 14, 2)->default(0)->comment('授信额度');
            $table->decimal('current_balance', 14, 2)->default(0)->comment('当前应付');
            $table->tinyInteger('status')->default(1);
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('name');
        });
    }

    public function down(): void { Schema::dropIfExists('suppliers'); }
};
