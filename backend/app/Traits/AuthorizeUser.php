<?php

namespace App\Traits;

use Illuminate\Http\Response;

trait AuthorizeUser
{
    /**
     * Check if user has required permission
     */
    protected function authorize($permission)
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (!$user->hasPermission($permission)) {
            return response()->json(['message' => 'Unauthorized - Permission denied'], 403);
        }

        return true;
    }

    /**
     * Check if user has any of the given roles
     */
    protected function authorizeRole(...$roles)
    {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (!$user->hasAnyRole(...$roles)) {
            return response()->json(['message' => 'Unauthorized - Role denied'], 403);
        }

        return true;
    }
}
