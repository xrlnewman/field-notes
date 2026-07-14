<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('order_no', 50)->unique()->comment('收款/付款单号');
            $table->string('type', 20)->comment('receive 收款 / pay 付款');
            $table->string('payable_type', 80)->nullable()->comment('Customer/Supplier');
            $table->unsignedBigInteger('payable_id')->nullable();
            $table->string('source_type', 80)->nullable()->comment('SalesOrder/PurchaseOrder');
            $table->unsignedBigInteger('source_id')->nullable();
            $table->date('payment_date');
            $table->decimal('amount', 18, 2);
            $table->string('method', 30)->comment('cash/bank/wechat/alipay/credit');
            $table->string('account', 100)->nullable()->comment('银行账户/微信号');
            $table->foreignId('created_by')->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['payable_type', 'payable_id']);
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void { Schema::dropIfExists('payments'); }
};
