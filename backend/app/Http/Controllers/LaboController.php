<?php

namespace App\Http\Controllers;

use App\Models\Labo;
use Illuminate\Http\Request;

class LaboController extends Controller
{
    public function index()
    {
        return response()->json(Labo::with('armoirs')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:labos',
            'description' => 'nullable|string',
        ]);

        return response()->json(Labo::create($validated), 201);
    }

    public function show(Labo $labo)
    {
        return response()->json($labo->load('armoirs.casiers'));
    }

    public function update(Request $request, Labo $labo)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255|unique:labos,nom,' . $labo->id,
            'description' => 'nullable|string',
        ]);

        $labo->update($validated);
        return response()->json($labo);
    }

    public function destroy(Labo $labo)
    {
        $labo->delete();
        return response()->json(null, 204);
    }
}
