<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $r)
    {
        $q = Supplier::query();
        if ($r->filled('keyword')) {
            $q->where(fn($qq) => $qq->where('name', 'like', "%{$r->keyword}%")->orWhere('code', 'like', "%{$r->keyword}%")->orWhere('phone', 'like', "%{$r->keyword}%"));
        }
        if ($r->filled('status')) $q->where('status', $r->status);
        return $this->ok($q->orderByDesc('id')->paginate($r->input('per_page', 20)));
    }

    public function store(Request $r)
    {
        return $this->ok(Supplier::create($r->validate($this->rules())));
    }

    public function show(Supplier $supplier) { return $this->ok($supplier); }

    public function update(Request $r, Supplier $supplier)
    {
        $supplier->update($r->validate($this->rules($supplier->id)));
        return $this->ok($supplier);
    }

    public function destroy(Supplier $supplier)
    {
        if ($supplier->purchaseOrders()->exists()) return $this->fail('该供应商有关联采购单，无法删除');
        $supplier->delete();
        return $this->ok(null, '已删除');
    }

    protected function rules(?int $id = null): array
    {
        $unique = 'unique:suppliers,code' . ($id ? ",$id" : '');
        return [
            'code' => "required|string|max:50|$unique",
            'name' => 'required|string|max:100',
            'contact_name' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
            'tax_no' => 'nullable|string|max:30',
            'bank_name' => 'nullable|string|max:100',
            'bank_account' => 'nullable|string|max:50',
            'credit_limit' => 'nullable|numeric|min:0',
            'status' => 'nullable|integer|in:0,1',
            'remark' => 'nullable|string',
        ];
    }
}
