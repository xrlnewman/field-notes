<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductCategory extends Model
{
    use HasFactory;

    protected $fillable = ['parent_id', 'name', 'code', 'sort_order', 'status'];
    protected $casts = ['status' => 'integer', 'sort_order' => 'integer'];

    public function parent() { return $this->belongsTo(self::class, 'parent_id'); }
    public function children() { return $this->hasMany(self::class, 'parent_id'); }
    public function products() { return $this->hasMany(Product::class, 'category_id'); }
}
