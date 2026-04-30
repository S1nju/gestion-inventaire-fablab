<?php

namespace Database\Seeders;

use App\Models\User;
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
        // Seed fixed accounts for Breeze login tests and dashboard access.
        $users = [
            ['name' => 'Inventory Admin', 'email' => 'admin@inventory.local', 'password' => 'password'],
            ['name' => 'Faculty Manager', 'email' => 'faculty@inventory.local', 'password' => 'password'],
            ['name' => 'Service Responsable', 'email' => 'service@inventory.local', 'password' => 'password'],
            ['name' => 'Bureau Agent', 'email' => 'agent@inventory.local', 'password' => 'password'],
            ['name' => 'Test User', 'email' => 'test@example.com', 'password' => 'password'],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                ['name' => $user['name'], 'password' => $user['password']]
            );
        }

        User::factory(5)->create();

        // Run role and permission seeder
        $this->call(RolePermissionSeeder::class);
    }
}
