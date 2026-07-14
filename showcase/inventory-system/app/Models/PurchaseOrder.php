<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_DRAFT = 'draft';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_RECEIVED = 'received';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_no', 'supplier_id', 'warehouse_id', 'order_date', 'expected_date', 'status',
        'total_quantity', 'total_amount', 'tax_amount', 'grand_total', 'paid_amount',
        'payment_method', 'payment_status',
        'created_by', 'confirmed_by', 'received_by', 'confirmed_at', 'received_at',
        'remark',
    ];

    protected $casts = [
        'order_date' => 'date', 'expected_date' => 'date',
        'confirmed_at' => 'datetime', 'received_at' => 'datetime',
        'total_quantity' => 'decimal:4',
        'total_amount' => 'decimal:2', 'tax_amount' => 'decimal:2',
        'grand_total' => 'decimal:2', 'paid_amount' => 'decimal:2',
    ];

    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function items() { return $this->hasMany(PurchaseOrderItem::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function confirmer() { return $this->belongsTo(User::class, 'confirmed_by'); }
    public function receiver() { return $this->belongsTo(User::class, 'received_by'); }
    public function payments() { return $this->morphMany(Payment::class, 'source'); }
}
