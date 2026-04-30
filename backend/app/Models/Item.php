<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'nom',
        'designation',
        'n_inventaire',
        'n_decharge',
        'description',
        'quantite',
        'bureau_id',
        'fournisseur_id',
    ];

    public function bureau()
    {
        return $this->belongsTo(Bereau::class, 'bureau_id');
    }

    public function fournisseur()
    {
        return $this->belongsTo(Fournisseur::class);
    }
    
    /**
     * Get all assignments through the ArticleResponsable pivot table
     */
    public function responsables()
    {
        return $this->belongsToMany(
            Responsable::class,
            'article_responsables',
            'article_id',
            'responsable_id'
        )->using(ArticleResponsable::class)
         ->as('assignment')
         ->withPivot('date_affectation', 'date_retrait', 'responsable_id_from', 'quantite_affectee', 'notes')
         ->withTimestamps();
    }

    /**
     * Get all assignments (including historical)
     */
    public function assignments()
    {
        return $this->hasMany(ArticleResponsable::class, 'article_id');
    }

    /**
     * Get the current responsible person
     */
    public function currentResponsible()
    {
        return $this->hasOne(ArticleResponsable::class, 'article_id')
            ->latestOfMany('date_affectation')
            ->where('date_retrait', null);
    }

    /**
     * Get complete movement history
     */
    public function movementHistory()
    {
        return $this->hasMany(ItemMovementHistory::class, 'item_id')
            ->orderBy('created_at', 'desc');
    }
}
