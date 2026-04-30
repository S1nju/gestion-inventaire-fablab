<?php

namespace App\Http\Controllers;

use App\Models\Armoir;
use Illuminate\Http\Request;

class ArmoirController extends Controller
{
    public function index(Request $request)
    {
        $query = Armoir::with(['labo', 'casiers']);
        if ($request->labo_id) {
            $query->where('labo_id', $request->labo_id);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom'     => 'required|string|max:255',
            'barcode' => 'nullable|string|unique:armoirs',
            'labo_id' => 'required|exists:labos,id',
        ]);

        return response()->json(Armoir::create($validated), 201);
    }

    public function show(Armoir $armoir)
    {
        return response()->json($armoir->load(['labo', 'casiers.items']));
    }

    public function update(Request $request, Armoir $armoir)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'barcode' => 'sometimes|required|string|unique:armoirs,barcode,' . $armoir->id,
            'labo_id' => 'sometimes|required|exists:labos,id',
        ]);

        $armoir->update($validated);
        return response()->json($armoir);
    }

    public function destroy(Armoir $armoir)
    {
        $armoir->delete();
        return response()->json(null, 204);
    }
}
