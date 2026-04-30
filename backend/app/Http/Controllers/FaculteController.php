<?php

namespace App\Http\Controllers;

use App\Models\Faculte;
use Illuminate\Http\Request;

/**
 * FaculteController - Handle CRUD operations for faculties
 */
class FaculteController extends Controller
{
    /**
     * Display a listing of faculties
     */
    public function index(Request $request)
    {
        $query = Faculte::query();
        
        // Search by name
        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $facultes = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $facultes,
        ]);
    }

    /**
     * Store a newly created faculty
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'doyen' => 'nullable|string',
            'email' => 'nullable|email',
        ]);

        $faculte = Faculte::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Faculte created successfully',
            'data' => $faculte,
        ], 201);
    }

    /**
     * Display the specified faculty
     */
    public function show(Faculte $faculte)
    {
        return response()->json([
            'success' => true,
            'data' => $faculte,
        ]);
    }

    /**
     * Update the specified faculty
     */
    public function update(Request $request, Faculte $faculte)
    {
        $validated = $request->validate([
            'nom' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'doyen' => 'nullable|string',
            'email' => 'nullable|email',
        ]);

        $faculte->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Faculte updated successfully',
            'data' => $faculte,
        ]);
    }

    /**
     * Delete the specified faculty
     */
    public function destroy(Faculte $faculte)
    {
        $faculte->delete();

        return response()->json([
            'success' => true,
            'message' => 'Faculte deleted successfully',
        ]);
    }
}
