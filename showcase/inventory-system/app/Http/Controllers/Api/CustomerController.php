<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $r)
    {
        $q = Customer::query();
        if ($r->filled('keyword')) {
            $q->where(fn($qq) => $qq->where('name', 'like', "%{$r->keyword}%")->orWhere('code', 'like', "%{$r->keyword}%")->orWhere('phone', 'like', "%{$r->keyword}%"));
        }
        if ($r->filled('level')) $q->where('level', $r->level);
        if ($r->filled('status')) $q->where('status', $r->status);
        return $this->ok($q->orderByDesc('id')->paginate($r->input('per_page', 20)));
    }

    public function store(Request $r) { return $this->ok(Customer::create($r->validate($this->rules()))); }
    public function show(Customer $customer) { return $this->ok($customer); }
    public function update(Request $r, Customer $customer)
    {
        $customer->update($r->validate($this->rules($customer->id)));
        return $this->ok($customer);
    }
    public function destroy(Customer $customer)
    {
        if ($customer->salesOrders()->exists()) return $this->fail('该客户有关联销售单，无法删除');
        $customer->delete();
        return $this->ok(null, '已删除');
    }

    protected function rules(?int $id = null): array
    {
        $unique = 'unique:customers,code' . ($id ? ",$id" : '');
        return [
            'code' => "required|string|max:50|$unique",
            'name' => 'required|string|max:100',
            'contact_name' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
            'tax_no' => 'nullable|string|max:30',
            'level' => 'nullable|string|max:20',
            'credit_limit' => 'nullable|numeric|min:0',
            'status' => 'nullable|integer|in:0,1',
            'remark' => 'nullable|string',
        ];
    }
}
