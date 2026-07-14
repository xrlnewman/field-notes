<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name', 'category_id', 'brand', 'unit', 'spec', 'barcode',
        'image', 'images', 'description',
        'cost_price', 'purchase_price', 'sales_price', 'retail_price',
        'safety_stock', 'max_stock',
        'has_sku', 'status', 'remark',
    ];

    protected $casts = [
        'images' => 'array',
        'cost_price' => 'decimal:4',
        'purchase_price' => 'decimal:4',
        'sales_price' => 'decimal:4',
        'retail_price' => 'decimal:4',
        'safety_stock' => 'decimal:4',
        'max_stock' => 'decimal:4',
        'has_sku' => 'boolean',
        'status' => 'integer',
    ];

    public function category() { return $this->belongsTo(ProductCategory::class, 'category_id'); }
    public function variants() { return $this->hasMany(ProductVariant::class); }
    public function stocks() { return $this->hasMany(Stock::class); }

    /** 总库存（所有仓库 / 所有 SKU 汇总） */
    public function getTotalStockAttribute(): float
    {
        return (float) $this->stocks()->sum('quantity');
    }

    public function scopeActive($q) { return $q->where('status', 1); }
}
