<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ManagerReport extends Model
{
    protected $fillable = [
        'type',
        'period_start',
        'period_end',
        'metrics_data',
        'file_path',
        'status',
        'validation_notes',
        'created_by',
        'validated_by',
        'validated_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'metrics_data' => 'array',
        'validated_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
