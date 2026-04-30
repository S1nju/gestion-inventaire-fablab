<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\ArticleResponsable;
use App\Models\Bereau;
use App\Models\ItemMovementHistory;
use App\Traits\TrackItemMovement;
use Illuminate\Http\Request;

/**
 * ItemMovementController - Handle item movements and assignments
 * 
 * This controller demonstrates how to track item movements from one
 * responsible person to another with complete audit trails.
 */
class ItemMovementController extends Controller
{
    use TrackItemMovement;

    /**
     * Get global movement history for all items
     *
     * GET /api/item-movements
     */
    public function getAllMovementHistory(Request $request)
    {
        $query = ItemMovementHistory::with([
            'item.bureau.service',
            'responsible',
            'previousResponsible',
            'performer',
        ])->orderBy('created_at', 'desc');

        // Filter by action type
        if ($request->filled('action_type')) {
            $query->where('action_type', $request->action_type);
        }

        // Filter by item id
        if ($request->filled('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        // Filter by item name
        if ($request->filled('item_name')) {
            $query->whereHas('item', function ($q) {
                $q->where('nom', 'like', '%' . request('item_name') . '%');
            });
        }

        // Filter by n_inventaire
        if ($request->filled('n_inventaire')) {
            $query->whereHas('item', function ($q) {
                $q->where('n_inventaire', 'like', '%' . request('n_inventaire') . '%');
            });
        }

        // Filter by bureau (from item's bureau or from/to responsible's bureau)
        if ($request->filled('bureau_id')) {
            $bureauId = $request->bureau_id;
            $query->where(function ($q) use ($bureauId) {
                $q->whereHas('item.bureau', function ($subQ) use ($bureauId) {
                    $subQ->where('id', $bureauId);
                })
                ->orWhereHas('responsible.bureau', function ($subQ) use ($bureauId) {
                    $subQ->where('id', $bureauId);
                })
                ->orWhereHas('previousResponsible.bureau', function ($subQ) use ($bureauId) {
                    $subQ->where('id', $bureauId);
                });
            });
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $history = $query->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Assign an item to a responsible person
     * 
     * POST /api/items/{item}/assign-to/{responsible}
     */
    public function assignItem(Request $request, Item $item)
    {
        $validated = $request->validate([
            'responsable_id' => 'required|exists:responsables,id',
            'quantite_affectee' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        // Create assignment record
        $assignment = ArticleResponsable::create([
            'article_id' => $item->id,
            'responsable_id' => $validated['responsable_id'],
            'date_affectation' => now(),
            'quantite_affectee' => $validated['quantite_affectee'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Record in movement history
        $this->recordAssignment(
            itemId: $item->id,
            responsableId: $validated['responsable_id'],
            quantity: $validated['quantite_affectee'],
            notes: $validated['notes'] ?? null,
            performedBy: auth()->id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Item assigned successfully',
            'data' => $assignment,
        ], 201);
    }

    /**
     * Transfer item from one responsible person to another
     * 
     * POST /api/items/{item}/transfer
     */
    public function transferItem(Request $request, Item $item)
    {
        $validated = $request->validate([
            'from_responsable_id' => 'required|exists:responsables,id',
            'to_responsable_id' => 'required|exists:responsables,id|different:from_responsable_id',
            'quantite_affectee' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        // Verify current assignment
        $currentAssignment = ArticleResponsable::where('article_id', $item->id)
            ->where('responsable_id', $validated['from_responsable_id'])
            ->whereNull('date_retrait')
            ->first();

        if (!$currentAssignment || $currentAssignment->quantite_affectee < $validated['quantite_affectee']) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid transfer quantity',
            ], 422);
        }

        // Mark old assignment as returned if fully transferred
        if ($currentAssignment->quantite_affectee === $validated['quantite_affectee']) {
            $currentAssignment->update(['date_retrait' => now()]);
        } else {
            // Reduce quantity if partial transfer
            $currentAssignment->decrement('quantite_affectee', $validated['quantite_affectee']);
        }

        // Create new assignment
        $newAssignment = ArticleResponsable::create([
            'article_id' => $item->id,
            'responsable_id' => $validated['to_responsable_id'],
            'responsable_id_from' => $validated['from_responsable_id'],
            'date_affectation' => now(),
            'quantite_affectee' => $validated['quantite_affectee'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Record transfer in movement history
        $this->recordAssignment(
            itemId: $item->id,
            responsableId: $validated['to_responsable_id'],
            previousResponsableId: $validated['from_responsable_id'],
            quantity: $validated['quantite_affectee'],
            notes: $validated['notes'] ?? 'Transfer between responsables',
            performedBy: auth()->id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Item transferred successfully',
            'data' => $newAssignment,
        ], 201);
    }

    /**
     * Transfer item from one bureau to another
     *
     * POST /api/items/{item}/transfer-bureau
     */
    public function transferItemBetweenBureaus(Request $request, Item $item)
    {
        $validated = $request->validate([
            'from_bureau_id' => 'required|exists:bureaus,id',
            'to_bureau_id' => 'required|exists:bureaus,id|different:from_bureau_id',
            'notes' => 'nullable|string',
        ]);

        if ((int) $item->bureau_id !== (int) $validated['from_bureau_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Item is not currently assigned to the source bureau',
            ], 422);
        }

        $fromBureau = Bereau::find($validated['from_bureau_id']);
        $toBureau = Bereau::find($validated['to_bureau_id']);

        $item->update([
            'bureau_id' => $validated['to_bureau_id'],
        ]);

        ItemMovementHistory::create([
            'item_id' => $item->id,
            'action_type' => 'bureau_transfer',
            'quantity' => max(1, (int) ($item->quantite ?? 1)),
            'notes' => $validated['notes']
                ?? sprintf(
                    'Transfer bureau: %s -> %s',
                    $fromBureau?->nom ?? ('#' . $validated['from_bureau_id']),
                    $toBureau?->nom ?? ('#' . $validated['to_bureau_id'])
                ),
            'performed_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Item transferred between bureaus successfully',
            'data' => $item->fresh(['bureau', 'currentResponsible']),
        ]);
    }

    /**
     * Return/withdraw item from a responsible person
     * 
     * POST /api/items/{item}/return
     */
    public function returnItem(Request $request, Item $item)
    {
        $validated = $request->validate([
            'responsable_id' => 'required|exists:responsables,id',
            'notes' => 'nullable|string',
        ]);

        // Mark assignment as returned
        $assignment = ArticleResponsable::where('article_id', $item->id)
            ->where('responsable_id', $validated['responsable_id'])
            ->whereNull('date_retrait')
            ->first();

        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'Item not found in assignments',
            ], 404);
        }

        $assignment->update([
            'date_retrait' => now(),
            'notes' => $validated['notes'] ?? $assignment->notes,
        ]);

        // Record return in movement history
        $this->recordReturn(
            itemId: $item->id,
            responsableId: $validated['responsable_id'],
            performedBy: auth()->id(),
            notes: $validated['notes'] ?? 'Item returned'
        );

        return response()->json([
            'success' => true,
            'message' => 'Item returned successfully',
            'data' => $assignment,
        ]);
    }

    /**
     * Get complete movement history for an item
     * 
     * GET /api/items/{item}/movement-history
     */
    public function getMovementHistory(Item $item)
    {
        $history = $item->movementHistory()
            ->with(['responsible', 'previousResponsible', 'performer'])
            ->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Get current items for a responsible person
     * 
     * GET /api/responsables/{responsable}/current-items
     */
    public function getCurrentItems($responsableId)
    {
        $items = ArticleResponsable::where('responsable_id', $responsableId)
            ->whereNull('date_retrait')
            ->with('item')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Get complete assignment history for a responsible person
     * 
     * GET /api/responsables/{responsable}/assignment-history
     */
    public function getResponsableHistory($responsableId)
    {
        $history = ItemMovementHistory::where('responsible_id', $responsableId)
            ->orWhere('previous_responsible_id', $responsableId)
            ->with(['item', 'responsible', 'previousResponsible'])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }
}
