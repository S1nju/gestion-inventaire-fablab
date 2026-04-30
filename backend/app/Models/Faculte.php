<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faculte extends Model
{
    protected $fillable = [
        'nom',
        'description',
        'doyen',
        'email',
    ];

    public function bureaus()
    {
        return $this->hasManyThrough(
            Bereau::class,
            Service::class,
            'faculte_id',
            'service_id',
            'id',
            'id'
        );
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    /**
     * Get all items in bureaus/responsables of this faculty (active assignments)
     */
    public function items()
    {
        return Item::whereHas('responsables', function ($q) {
            $q->whereHas('bureau', function ($qb) {
                $qb->whereHas('service', function ($qs) {
                    $qs->where('faculte_id', $this->id);
                });
            })
            ->whereNull('article_responsables.date_retrait');
        })->with('currentResponsible');
    }
}
