<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;

/**
 * ServiceController - Handle CRUD operations for services
 */
class ServiceController extends Controller
{
    /**
     * Display a listing of services
     */
    public function index(Request $request)
    {
        $query = Service::with('faculte');

        if ($request->filled('faculte_id')) {
            $query->where('faculte_id', $request->faculte_id);
        }
        
        // Search by name
        if ($request->has('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $services = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    /**
     * Store a newly created service
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'responsable_principal' => 'nullable|string',
            'faculte_id' => 'nullable|exists:facultes,id',
        ]);

        $service = Service::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully',
            'data' => $service,
        ], 201);
    }

    /**
     * Display the specified service
     */
    public function show(Service $service)
    {
        $service->load('faculte');

        return response()->json([
            'success' => true,
            'data' => $service,
        ]);
    }

    /**
     * Update the specified service
     */
    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'nom' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'responsable_principal' => 'nullable|string',
            'faculte_id' => 'nullable|exists:facultes,id',
        ]);

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully',
            'data' => $service,
        ]);
    }

    /**
     * Delete the specified service
     */
    public function destroy(Service $service)
    {
        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully',
        ]);
    }
}
