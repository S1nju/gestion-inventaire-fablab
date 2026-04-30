<?php

namespace App\Http\Controllers;

use App\Models\Responsable;
use Illuminate\Http\Request;

/**
 * ResponsableController - Handle CRUD operations for responsible persons
 */
class ResponsableController extends Controller
{
    /**
     * Display a listing of responsible persons
     */
    public function index(Request $request)
    {
        $query = Responsable::with('bureau', 'service', 'currentItems');
        
        // Filter by bureau
        if ($request->has('bureau_id')) {
            $query->where('bureau_id', $request->bureau_id);
        }
        
        // Filter by service
        if ($request->has('service_id')) {
            $query->where('service_id', $request->service_id);
        }
        
        // Search by name or email
        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
        }

        $responsables = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $responsables,
        ]);
    }

    /**
     * Store a newly created responsible person
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'nullable|email|unique:responsables',
            'telephone' => 'nullable|string',
            'titre' => 'nullable|string',
            'bureau_id' => 'nullable|exists:bureaus,id',
            'service_id' => 'nullable|exists:services,id',
        ]);

        $responsable = Responsable::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Responsable created successfully',
            'data' => $responsable,
        ], 201);
    }

    /**
     * Display the specified responsible person
     */
    public function show(Responsable $responsable)
    {
        $responsable->load([
            'bureau',
            'service',
            'currentItems' => fn($q) => $q->with('item'),
            'movementHistory' => fn($q) => $q->with('item')->limit(50),
        ]);

        return response()->json([
            'success' => true,
            'data' => $responsable,
        ]);
    }

    /**
     * Update the specified responsible person
     */
    public function update(Request $request, Responsable $responsable)
    {
        $validated = $request->validate([
            'nom' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:responsables,email,' . $responsable->id,
            'telephone' => 'nullable|string',
            'titre' => 'nullable|string',
            'bureau_id' => 'nullable|exists:bureaus,id',
            'service_id' => 'nullable|exists:services,id',
        ]);

        $responsable->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Responsable updated successfully',
            'data' => $responsable,
        ]);
    }

    /**
     * Delete the specified responsible person
     */
    public function destroy(Responsable $responsable)
    {
        $responsable->delete();

        return response()->json([
            'success' => true,
            'message' => 'Responsable deleted successfully',
        ]);
    }
}
