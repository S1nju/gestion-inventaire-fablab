<?php

namespace App\Http\Controllers;

use App\Models\Fournisseur;
use Illuminate\Http\Request;

/**
 * FournisseurController - Handle CRUD operations for suppliers/fournisseurs
 */
class FournisseurController extends Controller
{
    /**
     * Display a listing of fournisseurs
     */
    public function index(Request $request)
    {
        $query = Fournisseur::query();
        
        // Search by name, email, or city
        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('ville', 'like', '%' . $request->search . '%');
        }

        $fournisseurs = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $fournisseurs,
        ]);
    }

    /**
     * Store a newly created fournisseur
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'nullable|email|unique:fournisseurs',
            'telephone' => 'nullable|string',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string',
            'code_postal' => 'nullable|string',
            'pays' => 'nullable|string',
        ]);

        $fournisseur = Fournisseur::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Fournisseur created successfully',
            'data' => $fournisseur,
        ], 201);
    }

    /**
     * Display the specified fournisseur
     */
    public function show(Fournisseur $fournisseur)
    {
        return response()->json([
            'success' => true,
            'data' => $fournisseur,
        ]);
    }

    /**
     * Update the specified fournisseur
     */
    public function update(Request $request, Fournisseur $fournisseur)
    {
        $validated = $request->validate([
            'nom' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:fournisseurs,email,' . $fournisseur->id,
            'telephone' => 'nullable|string',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string',
            'code_postal' => 'nullable|string',
            'pays' => 'nullable|string',
        ]);

        $fournisseur->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Fournisseur updated successfully',
            'data' => $fournisseur,
        ]);
    }

    /**
     * Delete the specified fournisseur
     */
    public function destroy(Fournisseur $fournisseur)
    {
        $fournisseur->delete();

        return response()->json([
            'success' => true,
            'message' => 'Fournisseur deleted successfully',
        ]);
    }
}
