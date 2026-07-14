<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockTake extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_no', 'warehouse_id', 'take_date', 'status',
        'item_count', 'diff_count',
        'created_by', 'completed_by', 'completed_at', 'remark',
    ];

    protected $casts = [
        'take_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function items() { return $this->hasMany(StockTakeItem::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
