<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * ItemMovementHistory Model - Complete audit trail for item movements
 * 
 * Records every action related to item movement:
 * - Assignment to a responsible person
 * - Transfer from one person to another
 * - Return/withdrawal
 * - Any other relevant movement action
 */
class ItemMovementHistory extends Model
{
    protected $table = 'item_movement_history';

    protected $fillable = [
        'item_id',
        'article_responsable_id',
        'responsible_id',
        'previous_responsible_id',
        'action_type', // 'assignment', 'transfer', 'return', 'damage', 'loss', etc.
        'quantity',
        'notes',
        'performed_by', // User ID who performed the action
    ];

    protected $dates = [
        'created_at',
        'updated_at',
    ];

    /**
     * Get the item that was moved
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Get the corresponding article responsable record
     */
    public function articleResponsable()
    {
        return $this->belongsTo(ArticleResponsable::class);
    }

    /**
     * Get the responsible person it was moved to
     */
    public function responsible()
    {
        return $this->belongsTo(Responsable::class, 'responsible_id');
    }

    /**
     * Get the previous responsible person
     */
    public function previousResponsible()
    {
        return $this->belongsTo(Responsable::class, 'previous_responsible_id');
    }

    /**
     * Get the user who performed this movement
     */
    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    /**
     * Scope to get movements of a specific type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('action_type', $type);
    }

    /**
     * Scope to get recent movements
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
