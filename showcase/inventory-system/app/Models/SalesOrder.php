<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalesOrder extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_DRAFT = 'draft';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_SHIPPED = 'shipped';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_no', 'customer_id', 'warehouse_id', 'order_date', 'expected_date', 'status',
        'total_quantity', 'total_amount', 'tax_amount', 'discount_amount', 'grand_total', 'cost_total', 'paid_amount',
        'payment_method', 'payment_status',
        'salesman_id', 'created_by', 'confirmed_by', 'shipped_by', 'confirmed_at', 'shipped_at',
        'ship_address', 'ship_contact', 'ship_phone', 'remark',
    ];

    protected $casts = [
        'order_date' => 'date', 'expected_date' => 'date',
        'confirmed_at' => 'datetime', 'shipped_at' => 'datetime',
        'total_quantity' => 'decimal:4',
        'total_amount' => 'decimal:2', 'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2', 'grand_total' => 'decimal:2',
        'cost_total' => 'decimal:2', 'paid_amount' => 'decimal:2',
    ];

    public function customer() { return $this->belongsTo(Customer::class); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function items() { return $this->hasMany(SalesOrderItem::class); }
    public function salesman() { return $this->belongsTo(User::class, 'salesman_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function confirmer() { return $this->belongsTo(User::class, 'confirmed_by'); }
    public function shipper() { return $this->belongsTo(User::class, 'shipped_by'); }
    public function payments() { return $this->morphMany(Payment::class, 'source'); }

    /** 毛利润 */
    public function getProfitAttribute(): float
    {
        return (float) $this->grand_total - (float) $this->cost_total;
    }
}
