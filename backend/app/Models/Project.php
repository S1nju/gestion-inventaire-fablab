<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'type', // PFE, Mini projet, Activités scientifiques, Autre
        'annee_enseignement',
        'encadrant_id',
        'status', // actif, termine
    ];

    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    public function items()
    {
        return $this->belongsToMany(Item::class)->withPivot('quantite')->withTimestamps();
    }

    public function encadrant()
    {
        return $this->belongsTo(Encadrant::class);
    }
}
