<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComponentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nom_composant',
        'quantite',
        'status', // pending, approved, rejected
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
