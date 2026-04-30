<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Labo extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'description',
    ];

    public function armoirs()
    {
        return $this->hasMany(Armoir::class);
    }
}
