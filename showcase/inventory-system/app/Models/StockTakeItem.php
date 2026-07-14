<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockTakeItem extends Model
{
    protected $fillable = ['stock_take_id', 'product_id', 'variant_id', 'product_name', 'system_qty', 'actual_qty', 'remark'];
    protected $casts = [
        'system_qty' => 'decimal:4', 'actual_qty' => 'decimal:4', 'diff_qty' => 'decimal:4',
    ];

    public function take() { return $this->belongsTo(StockTake::class, 'stock_take_id'); }
    public function product() { return $this->belongsTo(Product::class); }
    public function variant() { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
}
