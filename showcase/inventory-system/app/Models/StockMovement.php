<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'warehouse_id', 'product_id', 'variant_id',
        'type', 'quantity', 'unit_cost', 'total_cost',
        'quantity_before', 'quantity_after',
        'source_type', 'source_id', 'source_no',
        'user_id', 'remark',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'unit_cost' => 'decimal:6',
        'total_cost' => 'decimal:4',
        'quantity_before' => 'decimal:4',
        'quantity_after' => 'decimal:4',
    ];

    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function product() { return $this->belongsTo(Product::class); }
    public function variant() { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
    public function user() { return $this->belongsTo(User::class); }
    public function source() { return $this->morphTo(); }
}
