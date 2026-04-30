<?php

namespace App\Http\Controllers;

use App\Models\Encadrant;
use Illuminate\Http\Request;

class EncadrantController extends Controller
{
    public function index()
    {
        return response()->json(Encadrant::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
        ]);

        return response()->json(Encadrant::create($validated), 201);
    }
}
