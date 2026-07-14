<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // 商品分类
        $cat1 = ProductCategory::firstOrCreate(['name' => '电子产品']);
        $cat2 = ProductCategory::firstOrCreate(['name' => '办公用品']);

        // 商品
        Product::firstOrCreate(['code' => 'P001'], [
            'name' => '机械键盘', 'category_id' => $cat1->id, 'unit' => '个',
            'cost_price' => 150, 'purchase_price' => 200, 'sales_price' => 299, 'retail_price' => 399,
            'safety_stock' => 10, 'status' => 1,
        ]);
        Product::firstOrCreate(['code' => 'P002'], [
            'name' => '无线鼠标', 'category_id' => $cat1->id, 'unit' => '个',
            'cost_price' => 50, 'purchase_price' => 65, 'sales_price' => 99, 'retail_price' => 129,
            'safety_stock' => 20, 'status' => 1,
        ]);
        Product::firstOrCreate(['code' => 'P003'], [
            'name' => 'A4 复印纸', 'category_id' => $cat2->id, 'unit' => '包',
            'cost_price' => 18, 'purchase_price' => 22, 'sales_price' => 28, 'retail_price' => 35,
            'safety_stock' => 50, 'status' => 1,
        ]);

        Supplier::firstOrCreate(['code' => 'S001'], [
            'name' => '示例供应商', 'contact_name' => '示例联系人', 'phone' => '00000000000', 'status' => 1,
        ]);

        Customer::firstOrCreate(['code' => 'C001'], [
            'name' => '示例客户', 'contact_name' => '示例联系人', 'phone' => '00000000000', 'level' => '一般客户', 'status' => 1,
        ]);
    }
}
