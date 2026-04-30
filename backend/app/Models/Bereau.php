<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bereau extends Model
{
    protected $table = 'bureaus';

    protected $fillable = [
        'nom',
        'description',
        'localisation',
        'service_id',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    public function faculte()
    {
        return $this->hasOneThrough(
            Faculte::class,
            Service::class,
            'id',
            'id',
            'service_id',
            'faculte_id'
        );
    }

    public function responsables()
    {
        return $this->hasMany(Responsable::class, 'bureau_id');
    }

    /**
     * Get all items assigned to responsables in this bureau (active assignments)
     */
    public function items()
    {
        return Item::whereHas('responsables', function ($q) {
            $q->where('bureau_id', $this->id)
              ->whereNull('article_responsables.date_retrait');
        })->with('currentResponsible');
    }
}
