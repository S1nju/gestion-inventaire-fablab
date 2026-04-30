<?php

namespace App\Http\Controllers;

use App\Models\Casier;
use Illuminate\Http\Request;

class CasierController extends Controller
{
    public function index(Request $request)
    {
        $query = Casier::with(['armoir.labo', 'type']);
        if ($request->armoir_id) {
            $query->where('armoir_id', $request->armoir_id);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'            => 'required|string|max:255',
            'barcode'        => 'nullable|string|unique:casiers',
            'armoir_id'      => 'required|exists:armoirs,id',
            'casier_type_id' => 'nullable|exists:casier_types,id',
        ]);

        return response()->json(Casier::create($validated), 201);
    }

    public function show(Casier $casier)
    {
        return response()->json($casier->load(['armoir.labo', 'type', 'items']));
    }

    public function update(Request $request, Casier $casier)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'barcode' => 'sometimes|required|string|unique:casiers,barcode,' . $casier->id,
            'armoir_id' => 'sometimes|required|exists:armoirs,id',
            'casier_type_id' => 'nullable|exists:casier_types,id',
        ]);

        $casier->update($validated);
        return response()->json($casier);
    }

    public function destroy(Casier $casier)
    {
        $casier->delete();
        return response()->json(null, 204);
    }
}
