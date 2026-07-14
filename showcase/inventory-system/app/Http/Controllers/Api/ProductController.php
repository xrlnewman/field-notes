<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $r)
    {
        $q = Product::query()->with(['category:id,name', 'variants']);
        if ($r->filled('keyword')) {
            $q->where(fn($qq) => $qq->where('name', 'like', "%{$r->keyword}%")->orWhere('code', 'like', "%{$r->keyword}%")->orWhere('barcode', 'like', "%{$r->keyword}%"));
        }
        if ($r->filled('category_id')) $q->where('category_id', $r->category_id);
        if ($r->filled('status')) $q->where('status', $r->status);
        if ($r->boolean('low_stock')) {
            $q->whereHas('stocks', null, '<', 'safety_stock')->orWhereDoesntHave('stocks');
        }
        return $this->ok($q->orderByDesc('id')->paginate($r->input('per_page', 20)));
    }

    public function categoryTree()
    {
        $all = ProductCategory::where('status', 1)->orderBy('sort_order')->get();
        $build = function ($parentId) use (&$build, $all) {
            return $all->where('parent_id', $parentId)->values()->map(fn($c) => [
                'id' => $c->id, 'name' => $c->name, 'parent_id' => $c->parent_id, 'sort_order' => $c->sort_order,
                'children' => $build($c->id),
            ]);
        };
        return $this->ok($build(null));
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'code' => 'required|string|max:50|unique:products,code',
            'name' => 'required|string|max:200',
            'category_id' => 'nullable|integer|exists:product_categories,id',
            'brand' => 'nullable|string|max:100',
            'unit' => 'nullable|string|max:20',
            'spec' => 'nullable|string|max:200',
            'barcode' => 'nullable|string|max:50',
            'image' => 'nullable|string',
            'images' => 'nullable|array',
            'description' => 'nullable|string',
            'cost_price' => 'nullable|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'sales_price' => 'nullable|numeric|min:0',
            'retail_price' => 'nullable|numeric|min:0',
            'safety_stock' => 'nullable|numeric|min:0',
            'max_stock' => 'nullable|numeric|min:0',
            'has_sku' => 'nullable|boolean',
            'variants' => 'nullable|array',
            'variants.*.sku' => 'required_with:variants|string|max:80',
            'variants.*.attributes' => 'nullable|array',
            'variants.*.sales_price' => 'nullable|numeric|min:0',
            'remark' => 'nullable|string',
            'status' => 'nullable|integer|in:0,1',
        ]);

        $variants = $data['variants'] ?? null;
        unset($data['variants']);
        $product = Product::create($data);
        if ($variants) {
            foreach ($variants as $v) $product->variants()->create($v);
            $product->update(['has_sku' => true]);
        }
        return $this->ok($product->load('variants'));
    }

    public function show(Product $product)
    {
        return $this->ok($product->load(['category', 'variants', 'stocks.warehouse']));
    }

    public function update(Request $r, Product $product)
    {
        $data = $r->validate([
            'name' => 'sometimes|string|max:200',
            'category_id' => 'nullable|integer|exists:product_categories,id',
            'brand' => 'nullable|string|max:100',
            'unit' => 'nullable|string|max:20',
            'spec' => 'nullable|string|max:200',
            'barcode' => 'nullable|string|max:50',
            'image' => 'nullable|string',
            'images' => 'nullable|array',
            'description' => 'nullable|string',
            'cost_price' => 'nullable|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'sales_price' => 'nullable|numeric|min:0',
            'retail_price' => 'nullable|numeric|min:0',
            'safety_stock' => 'nullable|numeric|min:0',
            'max_stock' => 'nullable|numeric|min:0',
            'status' => 'nullable|integer|in:0,1',
            'remark' => 'nullable|string',
        ]);
        $product->update($data);
        return $this->ok($product->fresh());
    }

    public function destroy(Product $product)
    {
        if ($product->stocks()->where('quantity', '>', 0)->exists()) return $this->fail('商品还有库存，不能删除');
        $product->delete();
        return $this->ok(null, '已删除');
    }
}
