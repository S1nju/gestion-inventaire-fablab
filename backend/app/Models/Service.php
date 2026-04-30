<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'nom',
        'description',
        'responsable_principal',
        'faculte_id',
    ];

    public function faculte()
    {
        return $this->belongsTo(Faculte::class);
    }

    public function bureaus()
    {
        return $this->hasMany(Bereau::class, 'service_id');
    }

    public function responsables()
    {
        return $this->hasMany(Responsable::class, 'service_id');
    }

    /**
     * Get all items assigned to responsables in this service (active assignments)
     */
    public function items()
    {
        return Item::whereHas('responsables', function ($q) {
            $q->where('service_id', $this->id)
              ->whereNull('article_responsables.date_retrait');
        })->with('currentResponsible');
    }
}
