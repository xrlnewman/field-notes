<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name', 'contact_name', 'phone', 'email', 'address',
        'tax_no', 'level', 'credit_limit', 'current_balance', 'status', 'remark',
    ];

    protected $casts = ['credit_limit' => 'decimal:2', 'current_balance' => 'decimal:2', 'status' => 'integer'];

    public function salesOrders() { return $this->hasMany(SalesOrder::class); }
    public function payments() { return $this->morphMany(Payment::class, 'payable'); }

    public function scopeActive($q) { return $q->where('status', 1); }
}
