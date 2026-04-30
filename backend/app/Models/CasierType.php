<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CasierType extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
    ];

    public function casiers()
    {
        return $this->hasMany(Casier::class);
    }
}
