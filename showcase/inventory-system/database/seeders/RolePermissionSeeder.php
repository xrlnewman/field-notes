<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'warehouse' => ['view', 'create', 'update', 'delete'],
            'supplier'  => ['view', 'create', 'update', 'delete'],
            'customer'  => ['view', 'create', 'update', 'delete'],
            'product'   => ['view', 'create', 'update', 'delete'],
            'stock'     => ['view', 'movement_view', 'manual_in', 'manual_out'],
            'purchase'  => ['view', 'create', 'confirm', 'receive', 'cancel'],
            'sales'     => ['view', 'create', 'confirm', 'ship', 'complete', 'cancel'],
            'transfer'  => ['view', 'create', 'execute'],
            'stocktake' => ['view', 'create', 'update', 'complete'],
            'report'    => ['view'],
            'user'      => ['view', 'create', 'update', 'delete'],
            'role'      => ['view', 'create', 'update', 'delete'],
        ];

        foreach ($permissions as $group => $acts) {
            foreach ($acts as $act) {
                Permission::firstOrCreate(['name' => "$group.$act", 'guard_name' => 'sanctum', 'group' => $group, 'label' => "$group $act"]);
            }
        }

        // 超级管理员
        $admin = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'sanctum', 'label' => '超级管理员']);
        $admin->givePermissionTo(Permission::all());

        // 仓库管理员
        $stockMgr = Role::firstOrCreate(['name' => 'stock-manager', 'guard_name' => 'sanctum', 'label' => '仓库管理员']);
        $stockMgr->givePermissionTo(Permission::whereIn('group', ['warehouse', 'product', 'stock', 'transfer', 'stocktake'])->get());

        // 销售
        $sales = Role::firstOrCreate(['name' => 'sales', 'guard_name' => 'sanctum', 'label' => '销售员']);
        $sales->givePermissionTo(Permission::whereIn('group', ['customer', 'product', 'stock', 'sales', 'report'])->get());

        // 采购
        $purchase = Role::firstOrCreate(['name' => 'purchase', 'guard_name' => 'sanctum', 'label' => '采购员']);
        $purchase->givePermissionTo(Permission::whereIn('group', ['supplier', 'product', 'stock', 'purchase', 'report'])->get());
    }
}
