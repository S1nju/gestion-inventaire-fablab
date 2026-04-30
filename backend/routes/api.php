<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LaboController;
use App\Http\Controllers\ArmoirController;
use App\Http\Controllers\CasierController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ComponentRequestController;
use App\Http\Controllers\EncadrantController;
use App\Models\Role;

Route::post('/login', [AuthenticatedSessionController::class, 'apiStore'])
    ->withoutMiddleware([
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ]);

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return response()->json([
        'id'    => $request->user()->id,
        'name'  => $request->user()->name,
        'email' => $request->user()->email,
        'role'  => $request->user()->isAdmin() ? 'admin' : 'student',
    ]);
});

Route::middleware(['auth:sanctum'])->post('/logout', [AuthenticatedSessionController::class, 'destroy']);

Route::middleware(['auth:sanctum'])->group(function () {
    // Physical Storage
    Route::apiResource('labos', LaboController::class);
    Route::apiResource('armoirs', ArmoirController::class);
    Route::apiResource('casiers', CasierController::class);
    Route::apiResource('items', ItemController::class);
    Route::apiResource('encadrants', EncadrantController::class);

    // Project Management
    Route::apiResource('projects', ProjectController::class);
    Route::post('projects/{project}/add-items',                      [ProjectController::class, 'addItems']);
    Route::delete('projects/{project}/remove-item/{item}',           [ProjectController::class, 'removeItem']);
    Route::post('projects/{project}/update-item-status/{item}',      [ProjectController::class, 'updateItemStatus']);
    Route::post('projects/{project}/attach-student',                 [ProjectController::class, 'attachStudent']);
    Route::delete('projects/{project}/detach-student/{user}',        [ProjectController::class, 'detachStudent']);
    Route::post('projects/{project}/create-student',                 [ProjectController::class, 'createStudent']);

    // Component Requests
    Route::apiResource('component-requests', ComponentRequestController::class)->except(['destroy', 'show']);
    Route::post('component-requests/{componentRequest}/status',      [ComponentRequestController::class, 'updateStatus']);

    // Users - list students (admin panel)
    Route::get('/users/students', function () {
        $studentRole = Role::where('name', 'student')->first();
        if (!$studentRole) return response()->json([]);
        return response()->json($studentRole->users()->select('users.id', 'users.name', 'users.email')->get());
    });

    // Analytics / KPI
    Route::get('/stats', function () {
        $items = \App\Models\Item::all();
        $totalArticles        = $items->count();
        $totalEnStock         = $items->sum('quantite_en_stock');
        $totalEnProjet        = $items->sum('quantite_en_projet');
        $totalPerdu           = $items->sum('quantite_perdue');
        $totalEndommage       = $items->sum('quantite_endommagee');

        // Top items by usage (in project)
        $topItems = \App\Models\Item::orderByDesc('quantite_en_projet')->take(10)->get(['nom', 'quantite_en_stock', 'quantite_en_projet', 'quantite_perdue', 'quantite_endommagee']);

        // By Labo
        $labos = \App\Models\Labo::with('armoirs.casiers.items')->get()->map(function ($labo) {
            $allItems = collect();
            foreach ($labo->armoirs as $armoir) {
                foreach ($armoir->casiers as $casier) {
                    $allItems = $allItems->merge($casier->items);
                }
            }
            return [
                'nom'            => $labo->nom,
                'total_articles' => $allItems->count(),
                'total_stock'    => $allItems->sum('quantite_en_stock'),
            ];
        });

        return response()->json([
            'total_articles'    => $totalArticles,
            'total_en_stock'    => $totalEnStock,
            'total_en_projet'   => $totalEnProjet,
            'total_perdu'       => $totalPerdu,
            'total_endommage'   => $totalEndommage,
            'top_items'         => $topItems,
            'by_labo'           => $labos,
            'total_projets'     => \App\Models\Project::count(),
            'total_encadrants'  => \App\Models\Encadrant::count(),
        ]);
    });
});
