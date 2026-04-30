<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ItemMovementController;
use App\Http\Controllers\ResponsableController;
use App\Http\Controllers\FournisseurController;
use App\Http\Controllers\BureauController;
use App\Http\Controllers\FaculteController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ArticleResponsableController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

Route::post('/login', [AuthenticatedSessionController::class, 'apiStore'])
    ->withoutMiddleware([
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ]);

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    $user = $request->user()->load('roles.permissions');

    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'roles' => $user->roles->pluck('name')->values(),
        'permissions' => $user->roles
            ->flatMap(fn ($role) => $role->permissions->pluck('name'))
            ->unique()
            ->values(),
    ]);
});

Route::middleware(['auth:sanctum'])->post('/logout', [AuthenticatedSessionController::class, 'destroy']);
Route::middleware(['auth:sanctum'])->put('/user/password', [AuthenticatedSessionController::class, 'updatePassword']);

// ==================== INVENTORY MANAGEMENT ====================

// Items CRUD Routes
Route::middleware(['auth:sanctum'])->prefix('items')->group(function () {
    Route::get('', [ItemController::class, 'index'])->middleware('permission:view_inventory');
    Route::post('', [ItemController::class, 'store'])->middleware('permission:create_item');
    Route::get('{item}', [ItemController::class, 'show'])->middleware('permission:view_inventory');
    Route::put('{item}', [ItemController::class, 'update'])->middleware('permission:edit_item');
    Route::delete('{item}', [ItemController::class, 'destroy'])->middleware('permission:delete_item');
});

// ==================== ITEM MOVEMENT & TRACKING ====================

Route::middleware(['auth:sanctum'])->prefix('items')->group(function () {
    // Assign item to responsible person
    Route::post('{item}/assign-to', [ItemMovementController::class, 'assignItem'])->middleware('permission:create_movement');
    
    // Transfer item from one responsible to another
    Route::post('{item}/transfer', [ItemMovementController::class, 'transferItem'])->middleware('permission:create_movement');

    // Transfer item from one bureau to another
    Route::post('{item}/transfer-bureau', [ItemMovementController::class, 'transferItemBetweenBureaus'])->middleware('permission:create_movement');
    
    // Return item from responsible person
    Route::post('{item}/return', [ItemMovementController::class, 'returnItem'])->middleware('permission:create_movement');
    
    // Get movement history for an item
    Route::get('{item}/movement-history', [ItemMovementController::class, 'getMovementHistory'])->middleware('permission:view_movements');
});

Route::middleware(['auth:sanctum', 'permission:view_movements'])->get('/item-movements', [ItemMovementController::class, 'getAllMovementHistory']);

// ==================== RESPONSABLE MANAGEMENT ====================

// Responsable CRUD Routes
Route::middleware(['auth:sanctum'])->prefix('responsables')->group(function () {
    Route::get('', [ResponsableController::class, 'index'])->middleware('permission:view_inventory');
    Route::post('', [ResponsableController::class, 'store'])->middleware('permission:manage_bureaus');
    Route::get('{responsable}', [ResponsableController::class, 'show'])->middleware('permission:view_inventory');
    Route::put('{responsable}', [ResponsableController::class, 'update'])->middleware('permission:manage_bureaus');
    Route::delete('{responsable}', [ResponsableController::class, 'destroy'])->middleware('permission:manage_bureaus');
    
    // Get current items assigned to a responsible person
    Route::get('{responsable}/current-items', [ItemMovementController::class, 'getCurrentItems'])->middleware('permission:view_inventory');
    
    // Get assignment history for a responsible person
    Route::get('{responsable}/assignment-history', [ItemMovementController::class, 'getResponsableHistory'])->middleware('permission:view_movements');
});

// ==================== FOURNISSEUR MANAGEMENT ====================

// Fournisseur CRUD Routes
Route::middleware(['auth:sanctum'])->prefix('fournisseurs')->group(function () {
    Route::get('', [FournisseurController::class, 'index'])->middleware('permission:view_inventory');
    Route::post('', [FournisseurController::class, 'store'])->middleware('permission:edit_item');
    Route::get('{fournisseur}', [FournisseurController::class, 'show'])->middleware('permission:view_inventory');
    Route::put('{fournisseur}', [FournisseurController::class, 'update'])->middleware('permission:edit_item');
    Route::delete('{fournisseur}', [FournisseurController::class, 'destroy'])->middleware('permission:delete_item');
});

// ==================== BUREAU MANAGEMENT ====================

// Bureau CRUD Routes
Route::middleware(['auth:sanctum'])->prefix('bureaus')->group(function () {
    Route::get('', [BureauController::class, 'index'])->middleware('permission:view_inventory');
    Route::post('', [BureauController::class, 'store'])->middleware('permission:manage_bureaus');
    Route::get('{bureau}', [BureauController::class, 'show'])->middleware('permission:view_inventory');
    Route::put('{bureau}', [BureauController::class, 'update'])->middleware('permission:manage_bureaus');
    Route::delete('{bureau}', [BureauController::class, 'destroy'])->middleware('permission:manage_bureaus');
    
    // Get all items in this bureau
    Route::get('{bureau}/items', [ItemController::class, 'getItemsByBureau'])->middleware('permission:view_inventory');
});

// ==================== FACULTE MANAGEMENT ====================

// Faculte CRUD Routes
Route::middleware(['auth:sanctum'])->prefix('facultes')->group(function () {
    Route::get('', [FaculteController::class, 'index'])->middleware('permission:view_inventory');
    Route::post('', [FaculteController::class, 'store'])->middleware('permission:manage_bureaus');
    Route::get('{faculte}', [FaculteController::class, 'show'])->middleware('permission:view_inventory');
    Route::put('{faculte}', [FaculteController::class, 'update'])->middleware('permission:manage_bureaus');
    Route::delete('{faculte}', [FaculteController::class, 'destroy'])->middleware('permission:manage_bureaus');
    
    // Get all items in this faculty
    Route::get('{faculte}/items', [ItemController::class, 'getItemsByFaculte'])->middleware('permission:view_inventory');
});

// ==================== SERVICE MANAGEMENT ====================

// Service CRUD Routes
Route::middleware(['auth:sanctum'])->prefix('services')->group(function () {
    Route::get('', [ServiceController::class, 'index'])->middleware('permission:view_inventory');
    Route::post('', [ServiceController::class, 'store'])->middleware('permission:manage_bureaus');
    Route::get('{service}', [ServiceController::class, 'show'])->middleware('permission:view_inventory');
    Route::put('{service}', [ServiceController::class, 'update'])->middleware('permission:manage_bureaus');
    Route::delete('{service}', [ServiceController::class, 'destroy'])->middleware('permission:manage_bureaus');
    
    // Get all items in this service
    Route::get('{service}/items', [ItemController::class, 'getItemsByService'])->middleware('permission:view_inventory');
});

// ==================== ARTICLE RESPONSABLE MANAGEMENT ====================

// ArticleResponsable CRUD Routes
Route::middleware(['auth:sanctum'])->prefix('article-responsables')->group(function () {
    Route::get('', [ArticleResponsableController::class, 'index'])->middleware('permission:view_movements');
    Route::post('', [ArticleResponsableController::class, 'store'])->middleware('permission:create_movement');
    Route::get('{articleResponsable}', [ArticleResponsableController::class, 'show'])->middleware('permission:view_movements');
    Route::put('{articleResponsable}', [ArticleResponsableController::class, 'update'])->middleware('permission:edit_movement');
    Route::delete('{articleResponsable}', [ArticleResponsableController::class, 'destroy'])->middleware('permission:delete_movement');
});
