<?php

use Illuminate\Support\Facades\Route;

// ==================== HEALTH & STATUS ====================

/**
 * Health Check Endpoint
 */
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app_name' => config('app.name'),
        'app_version' => app()->version(),
        'environment' => app()->environment(),
        'timestamp' => now(),
        'uptime' => microtime(true),
    ]);
});

/**
 * API Status
 */
Route::get('/api/status', function () {
    return response()->json([
        'api' => 'operational',
        'database' => 'connected',
        'features' => [
            'item_tracking' => true,
            'movement_audit' => true,
            'role_management' => true,
        ],
    ]);
});

// ==================== DOCUMENTATION ====================

/**
 * API Documentation Home
 */
Route::get('/', function () {
    return response()->json([
        'title' => 'Gestion d\'Inventaire API',
        'version' => '1.0',
        'status' => 'ok',
        'docs' => url('/docs'),
        'health' => url('/health'),
    ]);
});

/**
 * API Documentation - HTML
 */
Route::get('/docs', function () {
    $endpoints = [
        'items' => '/api/items',
        'responsables' => '/api/responsables',
        'fournisseurs' => '/api/fournisseurs',
        'item-movement' => '/api/items/{id}/assign-to, transfer, return, movement-history',
    ];
    
    return response()->json([
        'title' => 'Gestion d\'Inventaire API Documentation',
        'version' => '1.0',
        'base_url' => url('/api'),
        'authentication' => 'Bearer Token (Sanctum)',
        'documentation_url' => 'See API_DOCUMENTATION.md',
        'quick_reference' => 'See QUICK_REFERENCE.md',
        'endpoints' => $endpoints,
    ]);
});

/**
 * Get All Routes
 */
Route::get('/routes', function () {
    $routes = [];
    foreach (\Illuminate\Support\Facades\Route::getRoutes() as $route) {
        if (strpos($route->uri, 'api') === 0) {
            $routes[] = [
                'method' => implode('|', $route->methods),
                'uri' => $route->uri,
                'name' => $route->getName(),
            ];
        }
    }
    
    return response()->json([
        'total_routes' => count($routes),
        'routes' => $routes,
    ]);
});

// ==================== TESTING & DEBUGGING ====================

/**
 * Test Database Connection
 */
Route::get('/test/database', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        return response()->json([
            'status' => 'connected',
            'database' => config('database.default'),
            'message' => 'Database connection successful',
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Database connection failed',
            'error' => $e->getMessage(),
        ], 500);
    }
});

/**
 * Test Application
 */
Route::get('/test/app', function () {
    return response()->json([
        'app_name' => config('app.name'),
        'app_url' => config('app.url'),
        'app_debug' => config('app.debug'),
        'app_env' => app()->environment(),
        'php_version' => PHP_VERSION,
        'laravel_version' => app()->version(),
        'sqlite_configured' => extension_loaded('pdo_sqlite'),
        'mysql_configured' => extension_loaded('pdo_mysql'),
        'postgresql_configured' => extension_loaded('pdo_pgsql'),
    ]);
});

/**
 * List Database Tables
 */
Route::get('/test/tables', function () {
    try {
        $tables = \Illuminate\Support\Facades\DB::select("
            SELECT TABLE_NAME FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            ORDER BY TABLE_NAME
        ");
        
        $table_names = array_map(fn($t) => $t->TABLE_NAME, $tables);
        
        return response()->json([
            'status' => 'success',
            'total_tables' => count($table_names),
            'tables' => $table_names,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
});

// ==================== QUICK REFERENCES ====================

/**
 * List Available Endpoints
 */
Route::get('/endpoints', function () {
    return response()->json([
        'inventory' => [
            'GET /api/items' => 'List all items',
            'POST /api/items' => 'Create new item',
            'GET /api/items/{id}' => 'Get item details',
            'PUT /api/items/{id}' => 'Update item',
            'DELETE /api/items/{id}' => 'Delete item',
        ],
        'movement_tracking' => [
            'POST /api/items/{id}/assign-to' => 'Assign item to responsible',
            'POST /api/items/{id}/transfer' => 'Transfer item between responsables',
            'POST /api/items/{id}/return' => 'Return item',
            'GET /api/items/{id}/movement-history' => 'Get item movement history',
        ],
        'responsables' => [
            'GET /api/responsables' => 'List responsables',
            'POST /api/responsables' => 'Create responsable',
            'GET /api/responsables/{id}' => 'Get responsable details',
            'GET /api/responsables/{id}/current-items' => 'Get current items',
            'GET /api/responsables/{id}/assignment-history' => 'Get assignment history',
        ],
        'organization' => [
            'GET/POST /api/facultes' => 'Faculties management',
            'GET/POST /api/services' => 'Services management',
            'GET/POST /api/bureaus' => 'Bureaus management',
        ],
        'other' => [
            'GET/POST /api/fournisseurs' => 'Suppliers management',
            'GET/POST /api/article-responsables' => 'Assignments management',
        ],
    ]);
});

/**
 * Help / API Info
 */
Route::get('/help', function () {
    return response()->json([
        'system' => 'Gestion d\'Inventaire',
        'version' => '1.0.0',
        'description' => 'Complete inventory management system with item tracking and movement history',
        'features' => [
            'Item tracking from responsable to responsable',
            'Complete audit trail of all movements',
            'Multi-level organization structure',
            'Supplier management',
            'Staff management',
            'Transfer history',
            'Advanced search and filtering',
        ],
        'authentication' => 'Sanctum Bearer Token',
        'base_url' => url('/api'),
        'documentation' => url('/docs'),
        'health_check' => url('/health'),
        'contact' => 'For support, see API_DOCUMENTATION.md',
    ]);
});

// ==================== AUTHENTICATION ====================

require __DIR__.'/auth.php';
