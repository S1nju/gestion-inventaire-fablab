<?php

namespace App\Http\Controllers;

use App\Models\ComponentRequest;
use Illuminate\Http\Request;

class ComponentRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->isAdmin()) {
            return response()->json(ComponentRequest::with('student')->get());
        } else {
            return response()->json($user->componentRequests);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_composant' => 'required|string',
            'quantite' => 'required|integer|min:1',
        ]);

        $compReq = new ComponentRequest($validated);
        $compReq->user_id = $request->user()->id;
        $compReq->save();

        return response()->json($compReq, 201);
    }

    public function updateStatus(Request $request, ComponentRequest $componentRequest)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $componentRequest->update($validated);
        return response()->json($componentRequest);
    }
}
