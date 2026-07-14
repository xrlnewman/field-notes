<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'sku', 'barcode', 'attributes', 'image',
        'cost_price', 'purchase_price', 'sales_price', 'retail_price',
        'safety_stock', 'status',
    ];

    protected $casts = [
        'attributes' => 'array',
        'cost_price' => 'decimal:4',
        'purchase_price' => 'decimal:4',
        'sales_price' => 'decimal:4',
        'retail_price' => 'decimal:4',
        'safety_stock' => 'decimal:4',
        'status' => 'integer',
    ];

    public function product() { return $this->belongsTo(Product::class); }
    public function stocks() { return $this->hasMany(Stock::class, 'variant_id'); }
}
