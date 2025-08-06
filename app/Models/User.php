<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Model
{
    use HasUuids;

    protected $table = 'users';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'username',
        'email',
        'password',
        'id_admin',
    ];

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'id_admin');
    }

    public function areaMaps()
    {
        return $this->hasMany(AreaMap::class, 'user_id');
    }

    public function dailyReports()
    {
        return $this->hasMany(DailyReport::class, 'user_id');
    }
}
