<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'n_inventaire',
        'fournisseur_code',
        'prix',
        'nom',
        'type_composant',
        'barcode',
        'quantite_en_stock',
        'quantite_en_projet',
        'quantite_endommagee',
        'quantite_perdue',
        'casier_id',
        'description',
    ];

    public function casier()
    {
        return $this->belongsTo(Casier::class);
    }

    // Add scope for quick status querying based on positive quantite values if needed
    public function getActiveStockAttribute()
    {
        return $this->quantite_en_stock;
    }
}
