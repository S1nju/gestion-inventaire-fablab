<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = [
            ['name' => 'view_inventory', 'description' => 'Can view inventory items'],
            ['name' => 'create_item', 'description' => 'Can create new inventory items'],
            ['name' => 'edit_item', 'description' => 'Can edit inventory items'],
            ['name' => 'delete_item', 'description' => 'Can delete inventory items'],
            ['name' => 'view_movements', 'description' => 'Can view movement history'],
            ['name' => 'create_movement', 'description' => 'Can create movements (transfer, assign, return)'],
            ['name' => 'edit_movement', 'description' => 'Can edit movements'],
            ['name' => 'delete_movement', 'description' => 'Can delete movements'],
            ['name' => 'view_reports', 'description' => 'Can view reports'],
            ['name' => 'manage_users', 'description' => 'Can manage users and roles'],
            ['name' => 'manage_bureaus', 'description' => 'Can manage bureaus and services'],
        ];

        $createdPermissions = [];
        foreach ($permissions as $permission) {
            $createdPermissions[$permission['name']] = Permission::firstOrCreate(
                ['name' => $permission['name']],
                ['description' => $permission['description']]
            );
        }

        // Create roles
        $editorRole = Role::firstOrCreate(
            ['name' => 'editor'],
            ['description' => 'Can create, edit, and delete items/movements']
        );

        $viewerRole = Role::firstOrCreate(
            ['name' => 'viewer'],
            ['description' => 'Can only view items and movements']
        );

        // Assign permissions to editor role (full inventory management + structure management)
        $editorPermissions = [
            'view_inventory',
            'create_item',
            'edit_item',
            'delete_item',
            'view_movements',
            'create_movement',
            'edit_movement',
            'delete_movement',
            'view_reports',
            'manage_bureaus',
        ];

        foreach ($editorPermissions as $permissionName) {
            if ($editorRole->permissions()->where('name', $permissionName)->doesntExist()) {
                $editorRole->permissions()->attach($createdPermissions[$permissionName]->id);
            }
        }

        // Assign permissions to viewer role (view only)
        $viewerPermissions = [
            'view_inventory',
            'view_movements',
            'view_reports',
        ];

        foreach ($viewerPermissions as $permissionName) {
            if ($viewerRole->permissions()->where('name', $permissionName)->doesntExist()) {
                $viewerRole->permissions()->attach($createdPermissions[$permissionName]->id);
            }
        }

        // Create test accounts
        $editorUser = User::firstOrCreate(
            ['email' => 'editor@test.com'],
            [
                'name' => 'Editor User',
                'password' => Hash::make('editor123'),
            ]
        );

        // Assign editor role to editor user
        if (!$editorUser->roles()->where('role_id', $editorRole->id)->exists()) {
            $editorUser->roles()->attach($editorRole->id);
        }

        $viewerUser = User::firstOrCreate(
            ['email' => 'viewer@test.com'],
            [
                'name' => 'Viewer User',
                'password' => Hash::make('viewer123'),
            ]
        );

        // Assign viewer role to viewer user
        if (!$viewerUser->roles()->where('role_id', $viewerRole->id)->exists()) {
            $viewerUser->roles()->attach($viewerRole->id);
        }

        // Ensure existing local test accounts can access protected APIs.
        $editorEmails = [
            'admin@inventory.local',
            'faculty@inventory.local',
            'service@inventory.local',
            'agent@inventory.local',
            'test@example.com',
        ];

        User::query()
            ->whereIn('email', $editorEmails)
            ->get()
            ->each(function (User $user) use ($editorRole) {
                if (!$user->roles()->where('role_id', $editorRole->id)->exists()) {
                    $user->roles()->attach($editorRole->id);
                }
            });

        echo "✅ Test accounts created:\n";
        echo "📧 Editor Account:\n";
        echo "   Email: editor@test.com\n";
        echo "   Password: editor123\n";
        echo "   Role: Editor (can create, edit, delete items & movements)\n\n";
        echo "📧 Viewer Account:\n";
        echo "   Email: viewer@test.com\n";
        echo "   Password: viewer123\n";
        echo "   Role: Viewer (can only view items & movements)\n";
    }
}
