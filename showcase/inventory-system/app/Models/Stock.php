<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'warehouse_id', 'product_id', 'variant_id',
        'quantity', 'reserved_quantity', 'avg_cost',
    ];

    protected $hidden = ['variant_key'];

    protected $casts = [
        'quantity' => 'decimal:4',
        'reserved_quantity' => 'decimal:4',
        'avg_cost' => 'decimal:6',
    ];

    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function product() { return $this->belongsTo(Product::class); }
    public function variant() { return $this->belongsTo(ProductVariant::class, 'variant_id'); }

    /** 可用库存（在库 - 占用） */
    public function getAvailableAttribute(): float
    {
        return max(0, (float) $this->quantity - (float) $this->reserved_quantity);
    }
}
