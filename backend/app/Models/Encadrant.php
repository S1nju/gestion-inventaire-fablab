<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Encadrant extends Model
{
    protected $fillable = ['nom'];

    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
