<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(Request $r)
    {
        $q = Warehouse::query();
        if ($r->filled('keyword')) {
            $q->where(fn($qq) => $qq->where('name', 'like', "%{$r->keyword}%")->orWhere('code', 'like', "%{$r->keyword}%"));
        }
        if ($r->filled('status')) $q->where('status', $r->status);
        return $this->ok($q->orderBy('sort_order')->orderBy('id')->paginate($r->input('per_page', 20)));
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'code' => 'required|string|max:50|unique:warehouses,code',
            'name' => 'required|string|max:100',
            'address' => 'nullable|string',
            'contact_name' => 'nullable|string|max:50',
            'contact_phone' => 'nullable|string|max:30',
            'manager_id' => 'nullable|integer|exists:users,id',
            'is_default' => 'nullable|boolean',
            'status' => 'nullable|integer|in:0,1',
            'sort_order' => 'nullable|integer',
            'remark' => 'nullable|string',
        ]);
        if (! empty($data['is_default'])) Warehouse::where('is_default', 1)->update(['is_default' => 0]);
        return $this->ok(Warehouse::create($data));
    }

    public function show(Warehouse $warehouse) { return $this->ok($warehouse->load('manager')); }

    public function update(Request $r, Warehouse $warehouse)
    {
        $data = $r->validate([
            'code' => 'sometimes|string|max:50|unique:warehouses,code,' . $warehouse->id,
            'name' => 'sometimes|string|max:100',
            'address' => 'nullable|string',
            'contact_name' => 'nullable|string|max:50',
            'contact_phone' => 'nullable|string|max:30',
            'manager_id' => 'nullable|integer|exists:users,id',
            'is_default' => 'nullable|boolean',
            'status' => 'nullable|integer|in:0,1',
            'sort_order' => 'nullable|integer',
            'remark' => 'nullable|string',
        ]);
        if (! empty($data['is_default'])) Warehouse::where('id', '!=', $warehouse->id)->where('is_default', 1)->update(['is_default' => 0]);
        $warehouse->update($data);
        return $this->ok($warehouse);
    }

    public function destroy(Warehouse $warehouse)
    {
        if ($warehouse->stocks()->where('quantity', '>', 0)->exists()) {
            return $this->fail('该仓库还有库存，无法删除');
        }
        $warehouse->delete();
        return $this->ok(null, '已删除');
    }
}
