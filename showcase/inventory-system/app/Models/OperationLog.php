<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OperationLog extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'user_id', 'username', 'action', 'module', 'description',
        'subject_type', 'subject_id', 'properties', 'ip', 'user_agent', 'created_at',
    ];
    protected $casts = ['properties' => 'array', 'created_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }
    public function subject() { return $this->morphTo(); }
}
