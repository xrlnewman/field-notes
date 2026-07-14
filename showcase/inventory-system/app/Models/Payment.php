<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_no', 'type', 'payable_type', 'payable_id', 'source_type', 'source_id',
        'payment_date', 'amount', 'method', 'account', 'created_by', 'remark',
    ];

    protected $casts = ['payment_date' => 'date', 'amount' => 'decimal:2'];

    public function payable() { return $this->morphTo(); }
    public function source() { return $this->morphTo(); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
