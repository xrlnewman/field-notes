<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name', 'contact_name', 'phone', 'email', 'address',
        'tax_no', 'bank_name', 'bank_account',
        'credit_limit', 'current_balance', 'status', 'remark',
    ];

    protected $casts = ['credit_limit' => 'decimal:2', 'current_balance' => 'decimal:2', 'status' => 'integer'];

    public function purchaseOrders() { return $this->hasMany(PurchaseOrder::class); }
    public function payments() { return $this->morphMany(Payment::class, 'payable'); }

    public function scopeActive($q) { return $q->where('status', 1); }
}
