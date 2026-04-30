<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArticleResponsable extends Model
{
    protected $table = 'article_responsables';
    
    protected $fillable = [
        'article_id',
        'responsable_id',
        'date_affectation',
        'date_retrait',
        'responsable_id_from',
        'quantite_affectee',
        'notes',
    ];

    protected $dates = [
        'date_affectation',
        'date_retrait',
        'created_at',
        'updated_at',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class, 'article_id');
    }

    public function responsable()
    {
        return $this->belongsTo(Responsable::class, 'responsable_id');
    }

    /**
     * Get the previous responsible person who transferred this item
     */
    public function transferredFrom()
    {
        return $this->belongsTo(Responsable::class, 'responsable_id_from');
    }

    /**
     * Scope for currently active assignments
     */
    public function scopeActive($query)
    {
        return $query->whereNull('date_retrait');
    }

    /**
     * Scope for historical assignments
     */
    public function scopeHistorical($query)
    {
        return $query->whereNotNull('date_retrait');
    }

    /**
     * Scope to get assignments in descending order (latest first)
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('date_affectation', 'desc');
    }
}
