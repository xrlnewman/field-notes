<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable();
            $table->string('username', 50)->nullable();
            $table->string('action', 50)->comment('login/logout/create/update/delete/business 等');
            $table->string('module', 50)->nullable();
            $table->string('description');
            $table->string('subject_type', 80)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('properties')->nullable()->comment('上下文数据');
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['user_id', 'created_at']);
            $table->index('action');
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void { Schema::dropIfExists('operation_logs'); }
};
