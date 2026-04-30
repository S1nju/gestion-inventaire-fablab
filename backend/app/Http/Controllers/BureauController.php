<?php

namespace App\Http\Controllers;

use App\Models\Bereau;
use Illuminate\Http\Request;

/**
 * BureauController - Handle CRUD operations for bureaus/offices
 */
class BureauController extends Controller
{
    /**
     * Display a listing of bureaus
     */
    public function index(Request $request)
    {
        $query = Bereau::with('service.faculte');
        
        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        if ($request->filled('faculte_id')) {
            $query->whereHas('service', function ($q) use ($request) {
                $q->where('faculte_id', $request->faculte_id);
            });
        }
        
        // Search by name
        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $bureaus = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $bureaus,
        ]);
    }

    /**
     * Store a newly created bureau
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'localisation' => 'nullable|string',
            'service_id' => 'nullable|exists:services,id',
        ]);

        $bureau = Bereau::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Bureau created successfully',
            'data' => $bureau,
        ], 201);
    }

    /**
     * Display the specified bureau
     */
    public function show(Bereau $bureau)
    {
        $bureau->load('service.faculte');

        return response()->json([
            'success' => true,
            'data' => $bureau,
        ]);
    }

    /**
     * Update the specified bureau
     */
    public function update(Request $request, Bereau $bureau)
    {
        $validated = $request->validate([
            'nom' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'localisation' => 'nullable|string',
            'service_id' => 'nullable|exists:services,id',
        ]);

        $bureau->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Bureau updated successfully',
            'data' => $bureau,
        ]);
    }

    /**
     * Delete the specified bureau
     */
    public function destroy(Bereau $bureau)
    {
        $bureau->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bureau deleted successfully',
        ]);
    }
}
