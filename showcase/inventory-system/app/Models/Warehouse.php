<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code', 'name', 'address', 'contact_name', 'contact_phone',
        'manager_id', 'is_default', 'status', 'sort_order', 'remark',
    ];

    protected $casts = ['is_default' => 'boolean', 'status' => 'integer', 'sort_order' => 'integer'];

    public function manager() { return $this->belongsTo(User::class, 'manager_id'); }
    public function stocks() { return $this->hasMany(Stock::class); }
    public function stockMovements() { return $this->hasMany(StockMovement::class); }
    public function purchaseOrders() { return $this->hasMany(PurchaseOrder::class); }
    public function salesOrders() { return $this->hasMany(SalesOrder::class); }

    public function scopeActive($q) { return $q->where('status', 1); }
}
