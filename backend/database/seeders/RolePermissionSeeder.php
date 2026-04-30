<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            ['name' => 'manage_inventory', 'description' => 'Can manage items, labos, armoirs, casiers'],
            ['name' => 'manage_projects', 'description' => 'Can create and assign projects'],
            ['name' => 'manage_users', 'description' => 'Can manage users and roles'],
            ['name' => 'view_own_projects', 'description' => 'Can view their own projects and components'],
            ['name' => 'request_components', 'description' => 'Can request new components'],
        ];

        $createdPermissions = [];
        foreach ($permissions as $permission) {
            $createdPermissions[$permission['name']] = Permission::firstOrCreate(
                ['name' => $permission['name']],
                ['description' => $permission['description']]
            );
        }

        // Create roles
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            ['description' => 'Full administrative control']
        );

        $studentRole = Role::firstOrCreate(
            ['name' => 'student'],
            ['description' => 'Student participant in projects']
        );

        // Assign permissions to admin role
        $adminPermissions = [
            'manage_inventory',
            'manage_projects',
            'manage_users',
        ];

        foreach ($adminPermissions as $permissionName) {
            if ($adminRole->permissions()->where('name', $permissionName)->doesntExist()) {
                $adminRole->permissions()->attach($createdPermissions[$permissionName]->id);
            }
        }

        // Assign permissions to student role
        $studentPermissions = [
            'view_own_projects',
            'request_components',
        ];

        foreach ($studentPermissions as $permissionName) {
            if ($studentRole->permissions()->where('name', $permissionName)->doesntExist()) {
                $studentRole->permissions()->attach($createdPermissions[$permissionName]->id);
            }
        }

        // Connect Admin Account to Admin Role
        $adminAccount = User::where('email', 'admin@inventory.local')->first();
        if ($adminAccount && !$adminAccount->roles()->where('role_id', $adminRole->id)->exists()) {
            $adminAccount->roles()->attach($adminRole->id);
        }

        // Connect Student Account to Student Role
        $studentAccount = User::where('email', 'student@inventory.local')->first();
        if ($studentAccount && !$studentAccount->roles()->where('role_id', $studentRole->id)->exists()) {
            $studentAccount->roles()->attach($studentRole->id);
        }
    }
}
