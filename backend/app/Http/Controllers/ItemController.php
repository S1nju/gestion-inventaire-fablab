<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index(Request $request)
    {
        $query = Item::with(['casier.armoir.labo']);
        
        // Search by name, n_inventaire or barcode
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', '%' . $search . '%')
                  ->orWhere('n_inventaire', 'like', '%' . $search . '%')
                  ->orWhere('barcode', 'like', '%' . $search . '%');
            });
        }

        // Search by barcode specifically
        if ($request->filled('barcode')) {
            $query->where('barcode', $request->barcode);
        }

        if ($request->filled('casier_id')) {
            $query->where('casier_id', $request->casier_id);
        }

        if ($request->filled('armoir_id')) {
            $query->whereHas('casier', function ($q) use ($request) {
                $q->where('armoir_id', $request->armoir_id);
            });
        }

        $query->orderByDesc('created_at')->orderByDesc('id');
        $items = $query->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'n_inventaire' => 'nullable|string|max:255|unique:items',
            'fournisseur_code' => 'nullable|string',
            'prix' => 'nullable|numeric',
            'nom' => 'required|string|max:255',
            'type_composant' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|unique:items',
            'quantite_en_stock' => 'required|integer|min:0',
            'quantite_en_projet' => 'required|integer|min:0',
            'quantite_endommagee' => 'required|integer|min:0',
            'quantite_perdue' => 'required|integer|min:0',
            'casier_id' => 'nullable|exists:casiers,id',
            'description' => 'nullable|string',
        ]);

        $item = Item::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Item created successfully',
            'data' => $item,
        ], 201);
    }

    public function show(Item $item)
    {
        $item->load(['casier.armoir.labo']);
        return response()->json(['success' => true, 'data' => $item]);
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'n_inventaire' => 'sometimes|nullable|string|max:255|unique:items,n_inventaire,' . $item->id,
            'fournisseur_code' => 'nullable|string',
            'prix' => 'nullable|numeric',
            'nom' => 'sometimes|required|string|max:255',
            'type_composant' => 'nullable|string|max:255',
            'barcode' => 'sometimes|nullable|string|unique:items,barcode,' . $item->id,
            'quantite_en_stock' => 'sometimes|required|integer|min:0',
            'quantite_en_projet' => 'sometimes|required|integer|min:0',
            'quantite_endommagee' => 'sometimes|required|integer|min:0',
            'quantite_perdue' => 'sometimes|required|integer|min:0',
            'casier_id' => 'nullable|exists:casiers,id',
            'description' => 'nullable|string',
        ]);

        $item->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully',
            'data' => $item,
        ]);
    }

    public function destroy(Item $item)
    {
        $item->delete();
        return response()->json([
            'success' => true,
            'message' => 'Item deleted successfully',
        ]);
    }
}
