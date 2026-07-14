import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const inventoryRoot = resolve('showcase/inventory-system');
const runtimeScript = join(inventoryRoot, 'scripts/prepare-runtime.php');
const seederPath = join(inventoryRoot, 'database/seeders/AdminUserSeeder.php');
const composerLockPath = join(inventoryRoot, 'composer.lock');
const stockMigrationPath = join(inventoryRoot, 'database/migrations/2025_01_04_000001_create_stocks_table.php');
const stockModelPath = join(inventoryRoot, 'app/Models/Stock.php');
const stockServicePath = join(inventoryRoot, 'app/Services/StockService.php');
const purchaseServicePath = join(inventoryRoot, 'app/Services/PurchaseService.php');
const salesServicePath = join(inventoryRoot, 'app/Services/SalesService.php');
const requiredRuntimeDirectories = [
  'bootstrap/cache',
  'storage/framework/cache/data',
  'storage/framework/sessions',
  'storage/framework/views',
  'storage/logs',
] as const;

function cleanAdminEnvironment(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  delete environment.INVENTORY_ADMIN_USERNAME;
  delete environment.INVENTORY_ADMIN_EMAIL;
  delete environment.INVENTORY_ADMIN_PASSWORD;
  return { ...environment, ...overrides };
}

function runSeeder(environment: NodeJS.ProcessEnv) {
  const probe = String.raw`
namespace Illuminate\Database { class Seeder {} }
namespace App\Models {
    class User {
        public static array $captured = [];
        public static function firstOrCreate(array $identity, array $attributes): self {
            self::$captured = ['identity' => $identity, 'attributes' => $attributes];
            return new self();
        }
        public function syncRoles(array $roles): void { self::$captured['roles'] = $roles; }
    }
}
namespace {
    function env(string $name): mixed {
        $value = getenv($name);
        return $value === false ? null : $value;
    }
    require $argv[1];
    try {
        (new \Database\Seeders\AdminUserSeeder())->run();
        echo json_encode(\App\Models\User::$captured, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    } catch (\Throwable $error) {
        fwrite(STDERR, get_class($error) . ': ' . $error->getMessage());
        exit(7);
    }
}`;

  return spawnSync('php', ['-r', probe, seederPath], {
    cwd: inventoryRoot,
    encoding: 'utf8',
    env: environment,
  });
}

function runOrderStateProbe() {
  const probe = String.raw`
namespace App\Models {
    class OrderQuery {
        private bool $locked = false;
        public function __construct(private string $modelClass) {}
        public function lockForUpdate(): self { $this->locked = true; return $this; }
        public function findOrFail(int $id): OrderStub {
            if (! $this->locked) throw new \LogicException('order query must be locked');
            $modelClass = $this->modelClass;
            return $modelClass::$stored[$id] ?? throw new \RuntimeException('order not found');
        }
    }

    abstract class OrderStub {
        public array $items = [];
        public ?string $remark = null;
        public int $supplier_id = 1;
        public int $customer_id = 1;
        public int $warehouse_id = 1;
        public int $id = 1;
        public string $order_no = 'TEST-1';
        public string $grand_total = '0.00';
        public mixed $confirmed_by = null;
        public mixed $confirmed_at = null;
        public mixed $received_by = null;
        public mixed $received_at = null;
        public mixed $shipped_by = null;
        public mixed $shipped_at = null;
        public mixed $cost_total = null;

        public function __construct(public string $status) {}
        public function update(array $attributes): void {
            foreach ($attributes as $key => $value) $this->{$key} = $value;
        }
        public function fresh(string $relation): static { return $this; }
        public static function persist(OrderStub $order): void { static::$stored[$order->id] = $order; }
        public static function query(): OrderQuery { return new OrderQuery(static::class); }
    }

    class PurchaseOrder extends OrderStub {
        public static array $stored = [];
        public const STATUS_DRAFT = 'draft';
        public const STATUS_CONFIRMED = 'confirmed';
        public const STATUS_RECEIVED = 'received';
        public const STATUS_CANCELLED = 'cancelled';
    }

    class SalesOrder extends OrderStub {
        public static array $stored = [];
        public const STATUS_DRAFT = 'draft';
        public const STATUS_CONFIRMED = 'confirmed';
        public const STATUS_SHIPPED = 'shipped';
        public const STATUS_COMPLETED = 'completed';
        public const STATUS_CANCELLED = 'cancelled';
    }

    class BalanceQuery { public function increment(string $column, mixed $amount): void {} }
    class Supplier { public static function where(string $column, mixed $value): BalanceQuery { return new BalanceQuery(); } }
    class Customer { public static function where(string $column, mixed $value): BalanceQuery { return new BalanceQuery(); } }
    class Stock {}
}
namespace Illuminate\Support\Facades {
    class DB { public static function transaction(callable $callback): mixed { return $callback(); } }
}
namespace App\Services { class StockService {} }
namespace {
    function auth(): object { return new class { public function id(): int { return 1; } }; }
    function now(): object { return new class { public function toDateString(): string { return '2026-07-14'; } }; }

    require $argv[1];
    require $argv[2];

    function outcome(callable $operation): string {
        try {
            $operation();
            return 'allowed';
        } catch (\RuntimeException $error) {
            return 'rejected:' . $error->getMessage();
        }
    }

    $purchase = new \App\Services\PurchaseService(new \App\Services\StockService());
    $sales = new \App\Services\SalesService(new \App\Services\StockService());
    $purchaseId = 0;
    $salesId = 1000;
    $purchaseOrder = function (string $status) use (&$purchaseId): \App\Models\PurchaseOrder {
        $stored = new \App\Models\PurchaseOrder($status);
        $stored->id = ++$purchaseId;
        \App\Models\PurchaseOrder::persist($stored);
        return clone $stored;
    };
    $salesOrder = function (string $status) use (&$salesId): \App\Models\SalesOrder {
        $stored = new \App\Models\SalesOrder($status);
        $stored->id = ++$salesId;
        \App\Models\SalesOrder::persist($stored);
        return clone $stored;
    };

    $purchaseStored = new \App\Models\PurchaseOrder('confirmed');
    $purchaseStored->id = 9001;
    \App\Models\PurchaseOrder::persist($purchaseStored);
    $purchaseStaleA = clone $purchaseStored;
    $purchaseStaleB = clone $purchaseStored;
    $salesStored = new \App\Models\SalesOrder('confirmed');
    $salesStored->id = 9002;
    \App\Models\SalesOrder::persist($salesStored);
    $salesStaleA = clone $salesStored;
    $salesStaleB = clone $salesStored;

    $results = [
        'purchase_confirm_draft' => outcome(fn () => $purchase->confirm($purchaseOrder('draft'))),
        'purchase_confirm_confirmed' => outcome(fn () => $purchase->confirm($purchaseOrder('confirmed'))),
        'purchase_receive_draft' => outcome(fn () => $purchase->receive($purchaseOrder('draft'))),
        'purchase_receive_confirmed' => outcome(fn () => $purchase->receive($purchaseOrder('confirmed'))),
        'purchase_receive_received' => outcome(fn () => $purchase->receive($purchaseOrder('received'))),
        'purchase_cancel_draft' => outcome(fn () => $purchase->cancel($purchaseOrder('draft'))),
        'purchase_cancel_confirmed' => outcome(fn () => $purchase->cancel($purchaseOrder('confirmed'))),
        'purchase_cancel_received' => outcome(fn () => $purchase->cancel($purchaseOrder('received'))),
        'purchase_cancel_cancelled' => outcome(fn () => $purchase->cancel($purchaseOrder('cancelled'))),
        'sales_confirm_draft' => outcome(fn () => $sales->confirm($salesOrder('draft'))),
        'sales_confirm_confirmed' => outcome(fn () => $sales->confirm($salesOrder('confirmed'))),
        'sales_ship_draft' => outcome(fn () => $sales->ship($salesOrder('draft'))),
        'sales_ship_confirmed' => outcome(fn () => $sales->ship($salesOrder('confirmed'))),
        'sales_complete_confirmed' => outcome(fn () => $sales->complete($salesOrder('confirmed'))),
        'sales_complete_shipped' => outcome(fn () => $sales->complete($salesOrder('shipped'))),
        'sales_cancel_draft' => outcome(fn () => $sales->cancel($salesOrder('draft'))),
        'sales_cancel_confirmed' => outcome(fn () => $sales->cancel($salesOrder('confirmed'))),
        'sales_cancel_shipped' => outcome(fn () => $sales->cancel($salesOrder('shipped'))),
        'sales_cancel_completed' => outcome(fn () => $sales->cancel($salesOrder('completed'))),
        'sales_cancel_cancelled' => outcome(fn () => $sales->cancel($salesOrder('cancelled'))),
        'purchase_receive_same_order_first' => outcome(fn () => $purchase->receive($purchaseStaleA)),
        'purchase_receive_same_order_second' => outcome(fn () => $purchase->receive($purchaseStaleB)),
        'sales_ship_same_order_first' => outcome(fn () => $sales->ship($salesStaleA)),
        'sales_ship_same_order_second' => outcome(fn () => $sales->ship($salesStaleB)),
    ];

    echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
}`;

  return spawnSync('php', ['-r', probe, purchaseServicePath, salesServicePath], {
    cwd: inventoryRoot,
    encoding: 'utf8',
  });
}

function phpMethodSource(source: string, methodName: string): string {
  const signature = source.indexOf(`public function ${methodName}`);
  if (signature < 0) return '';
  const bodyStart = source.indexOf('{', signature);
  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(signature, index + 1);
  }
  return '';
}

describe('Inventory System clean-install runtime', () => {
  it('在临时项目根目录真实且幂等地创建 Laravel 运行目录', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'inventory-runtime-'));

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const result = spawnSync('php', [runtimeScript, temporaryRoot], {
          encoding: 'utf8',
        });
        expect(result.status, result.stderr).toBe(0);
      }

      for (const directory of requiredRuntimeDirectories) {
        expect(existsSync(join(temporaryRoot, directory)), directory).toBe(true);
      }
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('在 Composer 生成 autoload 前准备目录且不依赖 .env.example', () => {
    const composer = JSON.parse(readFileSync(join(inventoryRoot, 'composer.json'), 'utf8'));
    const scripts = composer.scripts as Record<string, string[]>;

    expect(scripts['pre-autoload-dump']).toEqual(['@php scripts/prepare-runtime.php']);
    expect(scripts).not.toHaveProperty('post-root-package-install');
    expect(JSON.stringify(scripts)).not.toContain('.env.example');
  });

  it('提交 composer.lock 且 .gitignore 不再忽略它', () => {
    const ignoredEntries = readFileSync(join(inventoryRoot, '.gitignore'), 'utf8')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    expect(ignoredEntries).not.toContain('composer.lock');
    expect(existsSync(composerLockPath)).toBe(true);
    if (!existsSync(composerLockPath)) return;
    expect(JSON.parse(readFileSync(composerLockPath, 'utf8'))).toMatchObject({
      packages: expect.any(Array),
      'packages-dev': expect.any(Array),
      'content-hash': expect.any(String),
    });
  });
});

describe('Inventory System administrator seeding', () => {
  it.each([
    ['INVENTORY_ADMIN_USERNAME', {
      INVENTORY_ADMIN_EMAIL: 'owner@example.com', INVENTORY_ADMIN_PASSWORD: 'strong-pass-123',
    }],
    ['INVENTORY_ADMIN_EMAIL', {
      INVENTORY_ADMIN_USERNAME: 'owner', INVENTORY_ADMIN_PASSWORD: 'strong-pass-123',
    }],
    ['INVENTORY_ADMIN_PASSWORD', {
      INVENTORY_ADMIN_USERNAME: 'owner', INVENTORY_ADMIN_EMAIL: 'owner@example.com',
    }],
  ])('缺少 %s 时明确失败', (missingVariable, provided) => {
    const result = runSeeder(cleanAdminEnvironment(provided));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(missingVariable);
  });

  it('拒绝少于 12 位的管理员密码', () => {
    const result = runSeeder(cleanAdminEnvironment({
      INVENTORY_ADMIN_USERNAME: 'owner',
      INVENTORY_ADMIN_EMAIL: 'owner@example.com',
      INVENTORY_ADMIN_PASSWORD: 'short-pass',
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('12');
  });

  it('按 UTF-8 字符数拒绝只有 4 个字符但占 12 字节的密码', () => {
    const result = runSeeder(cleanAdminEnvironment({
      INVENTORY_ADMIN_USERNAME: 'owner',
      INVENTORY_ADMIN_EMAIL: 'owner@example.com',
      INVENTORY_ADMIN_PASSWORD: '密码密码',
    }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('12');
  });

  it('使用三个环境变量创建管理员并分配 super-admin 角色', () => {
    const environment = {
      INVENTORY_ADMIN_USERNAME: 'inventory-owner',
      INVENTORY_ADMIN_EMAIL: 'owner@example.com',
      INVENTORY_ADMIN_PASSWORD: 'strong-pass-123',
    };
    const result = runSeeder(cleanAdminEnvironment(environment));

    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      identity: { username: environment.INVENTORY_ADMIN_USERNAME },
      attributes: {
        name: '超级管理员',
        email: environment.INVENTORY_ADMIN_EMAIL,
        password: environment.INVENTORY_ADMIN_PASSWORD,
        status: 1,
      },
      roles: ['super-admin'],
    });
  });

  it('不保留默认弱口令并依赖 User 的 hashed cast', () => {
    const seeder = readFileSync(seederPath, 'utf8');
    const userModel = readFileSync(join(inventoryRoot, 'app/Models/User.php'), 'utf8');

    expect(seeder).not.toContain('admin123');
    expect(seeder).not.toContain("['username' => 'admin']");
    expect(userModel).toMatch(/['"]password['"]\s*=>\s*['"]hashed['"]/);
  });
});

describe('Inventory System stock identity and locking', () => {
  it('用 stored generated variant_key 归一 NULL 并参与唯一索引', () => {
    const migration = readFileSync(stockMigrationPath, 'utf8');
    const stockModel = readFileSync(stockModelPath, 'utf8');

    expect(migration).toMatch(
      /unsignedBigInteger\(['"]variant_key['"]\)[\s\S]*?storedAs\(['"]COALESCE\(`?variant_id`?,\s*0\)['"]\)/,
    );
    expect(migration).toContain("['warehouse_id', 'product_id', 'variant_key']");
    expect(migration).not.toContain("['warehouse_id', 'product_id', 'variant_id']");
    expect(stockModel).toMatch(/protected\s+\$hidden\s*=\s*\[[\s\S]*?['"]variant_key['"]/);
  });

  it('先 insertOrIgnore 原子确保空库存，再按同一 identity 行锁读取', () => {
    const service = readFileSync(stockServicePath, 'utf8');
    const start = service.indexOf('protected function lockStock');
    const end = service.indexOf('protected function validateParams', start);
    const lockStock = service.slice(start, end);
    const insertIndex = lockStock.indexOf('insertOrIgnore');
    const lockIndex = lockStock.indexOf('lockForUpdate');
    const firstOrFailIndex = lockStock.indexOf('firstOrFail');

    expect(start).toBeGreaterThanOrEqual(0);
    expect(insertIndex).toBeGreaterThanOrEqual(0);
    expect(lockIndex).toBeGreaterThan(insertIndex);
    expect(firstOrFailIndex).toBeGreaterThan(lockIndex);
    expect(lockStock).not.toContain('Stock::create');
    expect(lockStock).toMatch(/['"]quantity['"]\s*=>\s*0/);
    expect(lockStock).toMatch(/['"]reserved_quantity['"]\s*=>\s*0/);
    expect(lockStock).toMatch(/['"]avg_cost['"]\s*=>\s*0/);
    expect(lockStock).toMatch(/['"]created_at['"]\s*=>/);
    expect(lockStock).toMatch(/['"]updated_at['"]\s*=>/);
  });

  it('所有 lockStock 调用都位于库存事务内', () => {
    const service = readFileSync(stockServicePath, 'utf8');
    expect(service.match(/\$this->lockStock\(/g)).toHaveLength(4);

    for (const methodName of ['in', 'out', 'reserve', 'release']) {
      const method = phpMethodSource(service, methodName);
      expect(method.indexOf('DB::transaction'), `${methodName} transaction`).toBeGreaterThanOrEqual(0);
      expect(method.indexOf('$this->lockStock'), `${methodName} lockStock`).toBeGreaterThan(
        method.indexOf('DB::transaction'),
      );
    }
  });
});

describe('Inventory System strict order state machine', () => {
  it('所有状态 guard 均在事务内锁定订单最新行后执行', () => {
    const services = [
      [readFileSync(purchaseServicePath, 'utf8'), ['confirm', 'receive', 'cancel']],
      [readFileSync(salesServicePath, 'utf8'), ['confirm', 'ship', 'complete', 'cancel']],
    ] as const;

    for (const [service, methods] of services) {
      for (const methodName of methods) {
        const method = phpMethodSource(service, methodName);
        const transactionIndex = method.indexOf('DB::transaction');
        const lockIndex = method.indexOf('lockForUpdate');
        const guardIndex = method.indexOf('$order->status');

        expect(method, methodName).not.toBe('');
        expect(transactionIndex, `${methodName} transaction`).toBeGreaterThanOrEqual(0);
        expect(lockIndex, `${methodName} lock`).toBeGreaterThan(transactionIndex);
        expect(guardIndex, `${methodName} guard`).toBeGreaterThan(lockIndex);
        expect(method, methodName).toMatch(
          /::query\(\)\s*->lockForUpdate\(\)\s*->findOrFail\(\$order->id\)/,
        );
      }
    }
  });

  it('采购仅允许 draft 确认、confirmed 收货、draft/confirmed 取消', () => {
    const result = runOrderStateProbe();
    expect(result.status, result.stderr).toBe(0);
    const outcomes = JSON.parse(result.stdout) as Record<string, string>;

    expect(outcomes.purchase_confirm_draft).toBe('allowed');
    expect(outcomes.purchase_receive_confirmed).toBe('allowed');
    expect(outcomes.purchase_cancel_draft).toBe('allowed');
    expect(outcomes.purchase_cancel_confirmed).toBe('allowed');
    for (const transition of [
      'purchase_confirm_confirmed',
      'purchase_receive_draft',
      'purchase_receive_received',
      'purchase_cancel_received',
      'purchase_cancel_cancelled',
    ]) {
      expect(outcomes[transition], transition).toMatch(/^rejected:/);
    }
    expect(outcomes.purchase_receive_same_order_first).toBe('allowed');
    expect(outcomes.purchase_receive_same_order_second).toMatch(/^rejected:/);
  });

  it('销售仅允许 draft 确认、confirmed 发货、shipped 完成、draft/confirmed 取消', () => {
    const result = runOrderStateProbe();
    expect(result.status, result.stderr).toBe(0);
    const outcomes = JSON.parse(result.stdout) as Record<string, string>;

    expect(outcomes.sales_confirm_draft).toBe('allowed');
    expect(outcomes.sales_ship_confirmed).toBe('allowed');
    expect(outcomes.sales_complete_shipped).toBe('allowed');
    expect(outcomes.sales_cancel_draft).toBe('allowed');
    expect(outcomes.sales_cancel_confirmed).toBe('allowed');
    for (const transition of [
      'sales_confirm_confirmed',
      'sales_ship_draft',
      'sales_complete_confirmed',
      'sales_cancel_shipped',
      'sales_cancel_completed',
      'sales_cancel_cancelled',
    ]) {
      expect(outcomes[transition], transition).toMatch(/^rejected:/);
    }
    expect(outcomes.sales_ship_same_order_first).toBe('allowed');
    expect(outcomes.sales_ship_same_order_second).toMatch(/^rejected:/);
  });
});
