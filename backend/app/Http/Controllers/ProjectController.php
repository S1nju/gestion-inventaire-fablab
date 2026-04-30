<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Item;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->isAdmin()) {
            return response()->json(Project::with(['users', 'items'])->get());
        } else {
            $projects = $user->projects()->with(['users', 'items'])->get();
            return response()->json($projects);
        }
    }

    public function store(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'titre'             => 'required|string',
            'type'              => 'required|string',
            'annee_enseignement'=> 'nullable|string',
            'encadreur_nom'     => 'nullable|string',
            'status'            => 'sometimes|string|in:active,terminé,archivé',
            'student_ids'       => 'nullable|array',
            'student_ids.*'     => 'exists:users,id',
        ]);

        $project = Project::create($validated);

        if (!empty($validated['student_ids'])) {
            $project->users()->attach($validated['student_ids']);
        }

        return response()->json($project->load('users'), 201);
    }

    public function show(Request $request, Project $project)
    {
        $user = $request->user();
        if ($user->isStudent() && !$project->users()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json($project->load([
            'users',
            'items.casier.armoir.labo',
        ]));
    }

    public function update(Request $request, Project $project)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'titre'             => 'sometimes|string',
            'type'              => 'sometimes|string',
            'annee_enseignement'=> 'nullable|string',
            'encadreur_nom'     => 'nullable|string',
            'status'            => 'sometimes|string|in:active,terminé,archivé',
        ]);

        $project->update($validated);

        return response()->json($project->load(['users', 'items']));
    }

    // Add or update items in project (with stock decrease)
    public function addItems(Request $request, Project $project)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'items'             => 'required|array',
            'items.*.item_id'   => 'required|exists:items,id',
            'items.*.quantite'  => 'required|integer|min:1',
        ]);

        foreach ($validated['items'] as $itemData) {
            $item = Item::findOrFail($itemData['item_id']);
            $quantite = (int) $itemData['quantite'];

            if ($item->quantite_en_stock < $quantite) {
                return response()->json(['error' => 'Stock insuffisant pour «' . $item->nom . '» (disponible: ' . $item->quantite_en_stock . ')'], 400);
            }

            $existing = $project->items()->where('item_id', $item->id)->first();
            if ($existing) {
                $project->items()->updateExistingPivot($item->id, ['quantite' => $existing->pivot->quantite + $quantite]);
            } else {
                $project->items()->attach($item->id, ['quantite' => $quantite]);
            }

            $item->quantite_en_stock -= $quantite;
            $item->quantite_en_projet += $quantite;
            $item->save();
        }

        return response()->json($project->load(['users', 'items.casier.armoir.labo']));
    }

    // Remove an item from project and return stock
    public function removeItem(Request $request, Project $project, Item $item)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $existing = $project->items()->where('item_id', $item->id)->first();
        if (!$existing) {
            return response()->json(['error' => 'Item not in project'], 404);
        }

        $qte = $existing->pivot->quantite;
        $item->quantite_en_stock += $qte;
        $item->quantite_en_projet = max(0, $item->quantite_en_projet - $qte);
        $item->save();

        $project->items()->detach($item->id);

        return response()->json(['success' => true]);
    }

    // Update item status at end of project (return / damaged / lost)
    public function updateItemStatus(Request $request, Project $project, Item $item)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status'   => 'required|in:rendu,endommagé,perdu',
            'quantite' => 'required|integer|min:1',
        ]);

        $existing = $project->items()->where('item_id', $item->id)->first();
        if (!$existing) {
            return response()->json(['error' => 'Item not found in project'], 404);
        }

        $qte = min((int) $validated['quantite'], $existing->pivot->quantite);

        $item->quantite_en_projet = max(0, $item->quantite_en_projet - $qte);

        if ($validated['status'] === 'rendu') {
            $item->quantite_en_stock += $qte;
        } elseif ($validated['status'] === 'endommagé') {
            $item->quantite_endommagee += $qte;
        } elseif ($validated['status'] === 'perdu') {
            $item->quantite_perdue += $qte;
        }

        $item->save();

        $newQte = $existing->pivot->quantite - $qte;
        if ($newQte <= 0) {
            $project->items()->detach($item->id);
        } else {
            $project->items()->updateExistingPivot($item->id, ['quantite' => $newQte]);
        }

        return response()->json(['success' => true, 'item' => $item]);
    }

    // Attach an existing student to a project
    public function attachStudent(Request $request, Project $project)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $project->users()->syncWithoutDetaching([$validated['user_id']]);

        return response()->json($project->load('users'));
    }

    // Detach a student from project
    public function detachStudent(Request $request, Project $project, User $user)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $project->users()->detach($user->id);

        return response()->json(['success' => true]);
    }

    // Create a new student account and attach to project
    public function createStudent(Request $request, Project $project)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $student = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $studentRole = Role::where('name', 'student')->first();
        if ($studentRole) {
            $student->roles()->attach($studentRole->id);
        }

        $project->users()->attach($student->id);

        return response()->json($student, 201);
    }
}
