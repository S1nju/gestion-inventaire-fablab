<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Labo;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Accounts
        $users = [
            ['name' => 'Admin Account', 'email' => 'admin@inventory.local', 'password' => 'password'],
            ['name' => 'Student Account', 'email' => 'student@inventory.local', 'password' => 'password'],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                ['name' => $user['name'], 'password' => $user['password']]
            );
        }

        // 2. Seed Labos
        Labo::firstOrCreate(['nom' => 'Labo 1'], ['description' => 'Laboratory 1']);
        Labo::firstOrCreate(['nom' => 'Labo 3'], ['description' => 'Laboratory 3']);

        // Run role and permission seeder if it exists and handles new roles
        if (class_exists(RolePermissionSeeder::class)) {
            $this->call(RolePermissionSeeder::class);
        }
    }
}
