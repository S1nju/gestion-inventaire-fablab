<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Responsable extends Model
{
    protected $fillable = [
        'nom',
        'email',
        'telephone',
        'titre',
        'bureau_id',
        'service_id',
    ];

    public function bureau()
    {
        return $this->belongsTo(Bereau::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
    
    /**
     * Get all items assigned to this responsible person (through ArticleResponsable)
     */
    public function items()
    {
        return $this->belongsToMany(
            Item::class,
            'article_responsables',
            'responsable_id',
            'article_id'
        )->using(ArticleResponsable::class)
         ->as('assignment')
         ->withPivot('date_affectation', 'date_retrait', 'responsable_id_from', 'quantite_affectee', 'notes')
         ->withTimestamps();
    }

    /**
     * Get items currently assigned to this person (not returned)
     */
    public function currentItems()
    {
        return $this->hasMany(ArticleResponsable::class, 'responsable_id')
            ->whereNull('date_retrait')
            ->with('item');
    }

    /**
     * Get all assignment records for this person
     */
    public function assignmentRecords()
    {
        return $this->hasMany(ArticleResponsable::class, 'responsable_id');
    }

    /**
     * Get items this person has transferred FROM
     */
    public function transferredItems()
    {
        return $this->hasMany(ArticleResponsable::class, 'responsable_id_from');
    }

    /**
     * Get complete movement history involving this person
     */
    public function movementHistory()
    {
        return $this->hasMany(ItemMovementHistory::class, 'responsible_id')
            ->orderBy('created_at', 'desc');
    }
}
