<?php

namespace App\Http\Controllers;

use App\Models\ArticleResponsable;
use Illuminate\Http\Request;

/**
 * ArticleResponsableController - Handle CRUD operations for article-responsable assignments
 */
class ArticleResponsableController extends Controller
{
    /**
     * Display a listing of assignments
     */
    public function index(Request $request)
    {
        $query = ArticleResponsable::with('item', 'responsable', 'transferredFrom');
        
        // Filter active assignments
        if ($request->active) {
            $query->active();
        }
        
        // Filter historical assignments
        if ($request->historical) {
            $query->historical();
        }

        $assignments = $query->latest()->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    /**
     * Store a newly created assignment
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'article_id' => 'required|exists:items,id',
            'responsable_id' => 'required|exists:responsables,id',
            'date_affectation' => 'required|date',
            'quantite_affectee' => 'required|integer|min:1',
            'responsable_id_from' => 'nullable|exists:responsables,id',
            'notes' => 'nullable|string',
        ]);

        $assignment = ArticleResponsable::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Assignment created successfully',
            'data' => $assignment,
        ], 201);
    }

    /**
     * Display the specified assignment
     */
    public function show(ArticleResponsable $articleResponsable)
    {
        $articleResponsable->load('item', 'responsable', 'transferredFrom');

        return response()->json([
            'success' => true,
            'data' => $articleResponsable,
        ]);
    }

    /**
     * Update the specified assignment
     */
    public function update(Request $request, ArticleResponsable $articleResponsable)
    {
        $validated = $request->validate([
            'quantite_affectee' => 'nullable|integer|min:1',
            'date_retrait' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $articleResponsable->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Assignment updated successfully',
            'data' => $articleResponsable,
        ]);
    }

    /**
     * Delete the specified assignment
     */
    public function destroy(ArticleResponsable $articleResponsable)
    {
        $articleResponsable->delete();

        return response()->json([
            'success' => true,
            'message' => 'Assignment deleted successfully',
        ]);
    }
}
