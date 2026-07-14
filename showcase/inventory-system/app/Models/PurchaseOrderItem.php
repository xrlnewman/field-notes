<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id', 'product_id', 'variant_id',
        'product_name', 'product_code', 'unit',
        'quantity', 'received_quantity',
        'unit_price', 'tax_rate', 'amount', 'tax_amount', 'total', 'remark',
    ];

    protected $casts = [
        'quantity' => 'decimal:4', 'received_quantity' => 'decimal:4',
        'unit_price' => 'decimal:4', 'tax_rate' => 'decimal:2',
        'amount' => 'decimal:2', 'tax_amount' => 'decimal:2', 'total' => 'decimal:2',
    ];

    public function order() { return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id'); }
    public function product() { return $this->belongsTo(Product::class); }
    public function variant() { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
}
