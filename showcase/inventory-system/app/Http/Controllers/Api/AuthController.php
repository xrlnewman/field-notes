<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $data['username'])
            ->orWhere('email', $data['username'])
            ->orWhere('phone', $data['username'])
            ->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return $this->fail('账号或密码错误', 401, null, 401);
        }
        if ($user->status !== 1) {
            return $this->fail('账号已禁用', 403, null, 403);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => $user->only(['id', 'username', 'name', 'avatar', 'email', 'phone', 'default_warehouse_id']),
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ], '登录成功');
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return $this->ok([
            'user' => $user->only(['id', 'username', 'name', 'avatar', 'email', 'phone', 'default_warehouse_id']),
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return $this->ok(null, '已退出');
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'old_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);
        $user = $request->user();
        if (! Hash::check($data['old_password'], $user->password)) {
            return $this->fail('原密码错误');
        }
        $user->update(['password' => $data['new_password']]);
        $user->tokens()->delete();
        return $this->ok(null, '密码已修改，请重新登录');
    }
}
