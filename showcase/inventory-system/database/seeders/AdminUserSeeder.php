<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    private const MINIMUM_PASSWORD_LENGTH = 12;

    public function run(): void
    {
        $username = $this->requiredEnvironmentVariable('INVENTORY_ADMIN_USERNAME');
        $email = $this->requiredEnvironmentVariable('INVENTORY_ADMIN_EMAIL');
        $password = $this->requiredEnvironmentVariable('INVENTORY_ADMIN_PASSWORD');

        if (mb_strlen($password, 'UTF-8') < self::MINIMUM_PASSWORD_LENGTH) {
            throw new RuntimeException(sprintf(
                'INVENTORY_ADMIN_PASSWORD 必须至少包含 %d 个字符',
                self::MINIMUM_PASSWORD_LENGTH,
            ));
        }

        $admin = User::firstOrCreate(
            ['username' => $username],
            ['name' => '超级管理员', 'email' => $email, 'password' => $password, 'status' => 1]
        );
        $admin->syncRoles(['super-admin']);
    }

    private function requiredEnvironmentVariable(string $name): string
    {
        $value = env($name);
        if (! is_string($value) || trim($value) === '') {
            throw new RuntimeException("缺少必填环境变量 {$name}");
        }

        return trim($value);
    }
}
