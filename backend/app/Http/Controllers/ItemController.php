<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;

/**
 * ItemController - Handle CRUD operations for items
 */
class ItemController extends Controller
{
    /**
     * Display a listing of items
     */
    public function index(Request $request)
    {
        $query = Item::with([
            'fournisseur',
            'bureau.service.faculte',
            'assignments.responsable.bureau.service.faculte',
            'assignments.responsable.service',
            'currentResponsible.responsable.bureau.service.faculte',
            'currentResponsible.responsable.service',
        ]);
        
        // Filter by fournisseur
        if ($request->has('fournisseur_id')) {
            $query->where('fournisseur_id', $request->fournisseur_id);
        }

        if ($request->filled('n_inventaire')) {
            $query->where('n_inventaire', 'like', '%' . $request->n_inventaire . '%');
        }

        if ($request->filled('bureau_id')) {
            $query->where('bureau_id', $request->bureau_id);
        }

        if ($request->filled('service_id')) {
            $query->whereHas('bureau.service', function ($q) use ($request) {
                $q->where('services.id', $request->service_id);
            });
        }

        if ($request->filled('faculte_id')) {
            $query->whereHas('bureau.service', function ($q) use ($request) {
                $q->where('faculte_id', $request->faculte_id);
            });
        }
        
        // Search by name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', '%' . $search . '%')
                  ->orWhere('designation', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%')
                  ->orWhere('n_inventaire', 'like', '%' . $search . '%');
            });
        }

        $query->orderByDesc('created_at')->orderByDesc('id');

        $items = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Store a newly created item
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'designation' => 'nullable|string|max:255',
            'n_inventaire' => 'nullable|string|max:255|unique:items',
            'n_decharge' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'quantite' => 'required|integer|min:0',
            'bureau_id' => 'nullable|exists:bureaus,id',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
        ]);

        $item = Item::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Item created successfully',
            'data' => $item,
        ], 201);
    }

    /**
     * Display the specified item
     */
    public function show(Item $item)
    {
        $item->load([
            'fournisseur',
            'bureau.service.faculte',
            'assignments' => fn($q) => $q->orderBy('date_affectation', 'desc'),
            'currentResponsible.responsable.bureau.service.faculte',
        ]);

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    /**
     * Update the specified item
     */
    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:255',
            'designation' => 'nullable|string|max:255',
            'n_inventaire' => 'nullable|string|max:255|unique:items,n_inventaire,' . $item->id,
            'n_decharge' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'quantite' => 'sometimes|integer|min:0',
            'bureau_id' => 'nullable|exists:bureaus,id',
            'fournisseur_id' => 'nullable|exists:fournisseurs,id',
        ]);

        $item->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully',
            'data' => $item,
        ]);
    }

    /**
     * Delete the specified item
     */
    public function destroy(Item $item)
    {
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item deleted successfully',
        ]);
    }

    /**
     * Get all items in a specific bureau
     * 
     * GET /api/bureaus/{bureau_id}/items
     */
    public function getItemsByBureau($bureauId, Request $request)
    {
        $query = Item::with('fournisseur', 'bureau.service.faculte', 'currentResponsible', 'assignments')
            ->where('bureau_id', $bureauId);

        // Search
        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $items = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Get all items in a specific service
     * 
     * GET /api/services/{service_id}/items
     */
    public function getItemsByService($serviceId, Request $request)
    {
        $query = Item::with('fournisseur', 'bureau.service.faculte', 'currentResponsible', 'assignments')
            ->whereHas('bureau.service', function ($q) use ($serviceId) {
                $q->where('services.id', $serviceId);
            });

        // Search
        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $items = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Get all items in a specific faculty
     * 
     * GET /api/facultes/{faculte_id}/items
     */
    public function getItemsByFaculte($faculteId, Request $request)
    {
        $query = Item::with('fournisseur', 'bureau.service.faculte', 'currentResponsible', 'assignments')
            ->whereHas('bureau.service', function ($q) use ($faculteId) {
                $q->where('faculte_id', $faculteId);
            });

        // Search
        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $items = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }
}
