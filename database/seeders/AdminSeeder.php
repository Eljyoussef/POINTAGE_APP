<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\User;
use App\Models\AreaMap;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create first admin
        $admin1 = Admin::create([
            'username' => 'admin1',
            'email' => 'admin1@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Create second admin
        $admin2 = Admin::create([
            'username' => 'admin2',
            'email' => 'admin2@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Create 3 users for admin1
        $users1 = [
            [
                'username' => 'user1_admin1',
                'email' => 'user1.admin1@example.com',
                'password' => Hash::make('password'),
                'id_admin' => $admin1->id,
            ],
            [
                'username' => 'user2_admin1',
                'email' => 'user2.admin1@example.com',
                'password' => Hash::make('password'),
                'id_admin' => $admin1->id,
            ],
            [
                'username' => 'user3_admin1',
                'email' => 'user3.admin1@example.com',
                'password' => Hash::make('password'),
                'id_admin' => $admin1->id,
            ],
        ];

        // Create 3 users for admin2
        $users2 = [
            [
                'username' => 'user1_admin2',
                'email' => 'user1.admin2@example.com',
                'password' => Hash::make('password'),
                'id_admin' => $admin2->id,
            ],
            [
                'username' => 'user2_admin2',
                'email' => 'user2.admin2@example.com',
                'password' => Hash::make('password'),
                'id_admin' => $admin2->id,
            ],
            [
                'username' => 'user3_admin2',
                'email' => 'user3.admin2@example.com',
                'password' => Hash::make('password'),
                'id_admin' => $admin2->id,
            ],
        ];

        // Create users for admin1
        foreach ($users1 as $userData) {
            $user = User::create($userData);
            
            // Create area map for each user with different coordinates
            AreaMap::create([
                'user_id' => $user->id,
                'latitude' => 48.8566 + (rand(-10, 10) / 100), // Paris area with variation
                'longitude' => 2.3522 + (rand(-10, 10) / 100),
                'radius' => rand(100, 500),
            ]);
        }

        // Create users for admin2
        foreach ($users2 as $userData) {
            $user = User::create($userData);
            
            // Create area map for each user with different coordinates
            AreaMap::create([
                'user_id' => $user->id,
                'latitude' => 40.7128 + (rand(-10, 10) / 100), // New York area with variation
                'longitude' => -74.0060 + (rand(-10, 10) / 100),
                'radius' => rand(100, 500),
            ]);
        }
    }
} 