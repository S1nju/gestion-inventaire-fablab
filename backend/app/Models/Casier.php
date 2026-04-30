<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Casier extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'barcode',
        'armoir_id',
        'casier_type_id',
    ];

    public function armoir()
    {
        return $this->belongsTo(Armoir::class);
    }

    public function type()
    {
        return $this->belongsTo(CasierType::class, 'casier_type_id');
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }
}
