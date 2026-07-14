<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_order_id', 'product_id', 'variant_id',
        'product_name', 'product_code', 'unit',
        'quantity', 'shipped_quantity', 'unit_price', 'unit_cost',
        'discount', 'tax_rate', 'amount', 'tax_amount', 'total', 'remark',
    ];

    protected $casts = [
        'quantity' => 'decimal:4', 'shipped_quantity' => 'decimal:4',
        'unit_price' => 'decimal:4', 'unit_cost' => 'decimal:4',
        'discount' => 'decimal:2', 'tax_rate' => 'decimal:2',
        'amount' => 'decimal:2', 'tax_amount' => 'decimal:2', 'total' => 'decimal:2',
    ];

    public function order() { return $this->belongsTo(SalesOrder::class, 'sales_order_id'); }
    public function product() { return $this->belongsTo(Product::class); }
    public function variant() { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
}
