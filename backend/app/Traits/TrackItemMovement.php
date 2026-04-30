<?php

namespace App\Traits;

use App\Models\ItemMovementHistory;

/**
 * Trait for tracking item movements and creating audit trail entries
 * 
 * Usage: Add 'use TrackItemMovement;' to your controller or model
 */
trait TrackItemMovement
{
    /**
     * Record an item assignment movement
     * 
     * @param int $itemId - The item being assigned
     * @param int $responsableId - Who it's being assigned to
     * @param int|null $previousResponsableId - Who it's being transferred from
     * @param int $quantity - Quantity being moved
     * @param string $notes - Additional notes
     * @param int|null $performedBy - User ID performing the action
     * @return ItemMovementHistory
     */
    public function recordAssignment(
        $itemId,
        $responsableId,
        $previousResponsableId = null,
        $quantity = 1,
        $notes = null,
        $performedBy = null
    ) {
        $actionType = $previousResponsableId ? 'transfer' : 'assignment';

        return ItemMovementHistory::create([
            'item_id' => $itemId,
            'responsible_id' => $responsableId,
            'previous_responsible_id' => $previousResponsableId,
            'action_type' => $actionType,
            'quantity' => $quantity,
            'notes' => $notes,
            'performed_by' => $performedBy,
        ]);
    }

    /**
     * Record an item return/withdrawal
     * 
     * @param int $itemId - The item being returned
     * @param int $responsableId - Who is returning it
     * @param int|null $performedBy - User ID performing the action
     * @param string $notes - Reason for return
     * @return ItemMovementHistory
     */
    public function recordReturn(
        $itemId,
        $responsableId,
        $performedBy = null,
        $notes = null
    ) {
        return ItemMovementHistory::create([
            'item_id' => $itemId,
            'responsible_id' => $responsableId,
            'action_type' => 'return',
            'quantity' => 1,
            'notes' => $notes,
            'performed_by' => $performedBy,
        ]);
    }

    /**
     * Record damage or loss of an item
     * 
     * @param int $itemId - The damaged/lost item
     * @param string $type - 'damage' or 'loss'
     * @param int|null $responsableId - Who was responsible
     * @param int|null $performedBy - User ID reporting the issue
     * @param string $notes - Description of damage/loss
     * @return ItemMovementHistory
     */
    public function recordDamageOrLoss(
        $itemId,
        $type = 'damage',
        $responsableId = null,
        $performedBy = null,
        $notes = null
    ) {
        return ItemMovementHistory::create([
            'item_id' => $itemId,
            'responsible_id' => $responsableId,
            'action_type' => $type,
            'quantity' => 1,
            'notes' => $notes,
            'performed_by' => $performedBy,
        ]);
    }

    /**
     * Get complete movement history for an item
     * 
     * @param int $itemId - The item ID
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getItemMovementHistory($itemId)
    {
        return ItemMovementHistory::where('item_id', $itemId)
            ->orderBy('created_at', 'desc')
            ->with(['responsible', 'previousResponsible', 'performer'])
            ->get();
    }

    /**
     * Get items currently held by a responsible person
     * 
     * @param int $responsableId - The responsible person ID
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getCurrentItemsForResponsable($responsableId)
    {
        return ItemMovementHistory::where('responsible_id', $responsableId)
            ->where('action_type', '!=', 'return')
            ->orderBy('created_at', 'desc')
            ->with('item')
            ->get();
    }
}
