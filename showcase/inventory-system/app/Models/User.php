<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'username', 'name', 'email', 'phone', 'avatar', 'password',
        'default_warehouse_id', 'status',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'status' => 'integer',
        ];
    }

    public function defaultWarehouse() { return $this->belongsTo(Warehouse::class, 'default_warehouse_id'); }
    public function managedWarehouses() { return $this->hasMany(Warehouse::class, 'manager_id'); }
    public function operationLogs() { return $this->hasMany(OperationLog::class); }

    public function scopeActive($q) { return $q->where('status', 1); }
}
