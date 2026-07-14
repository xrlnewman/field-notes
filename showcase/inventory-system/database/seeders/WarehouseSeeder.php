<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        Warehouse::firstOrCreate(['code' => 'MAIN'], [
            'name' => '主仓库', 'address' => '默认地址', 'is_default' => 1, 'status' => 1, 'sort_order' => 0,
        ]);
        Warehouse::firstOrCreate(['code' => 'WH02'], [
            'name' => '二号仓', 'is_default' => 0, 'status' => 1, 'sort_order' => 1,
        ]);
    }
}
