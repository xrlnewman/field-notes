<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockTransfer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_no', 'from_warehouse_id', 'to_warehouse_id', 'transfer_date',
        'status', 'total_quantity', 'created_by', 'confirmed_by',
        'confirmed_at', 'received_at', 'remark',
    ];

    protected $casts = [
        'transfer_date' => 'date',
        'confirmed_at' => 'datetime', 'received_at' => 'datetime',
        'total_quantity' => 'decimal:4',
    ];

    public function fromWarehouse() { return $this->belongsTo(Warehouse::class, 'from_warehouse_id'); }
    public function toWarehouse() { return $this->belongsTo(Warehouse::class, 'to_warehouse_id'); }
    public function items() { return $this->hasMany(StockTransferItem::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
