<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Armoir extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'barcode',
        'labo_id',
    ];

    public function labo()
    {
        return $this->belongsTo(Labo::class);
    }

    public function casiers()
    {
        return $this->hasMany(Casier::class);
    }
}
