<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;





Route::get('/', function () {
    return Inertia::render('Auth/Login');
});

// Test route for authentication

Route::middleware('auth:admin')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/maps', [MapController::class, 'index'])->name('maps');
    Route::get('/getMaps', [MapController::class, 'usersPositions'])->name('mapsFetch');
    
    Route::post('/map-positions', [MapController::class, 'affectePosition'])->name('map.positions.store');
    Route::put('/map-positions/{positionId}', [MapController::class, 'affectePosition'])->name('map.positions.update');
    Route::patch('/map-positions/{positionId}/radius', [MapController::class, 'updateUserRadius'])->name('map.positions.radius');
    Route::delete('/map-positions/{positionId}', [MapController::class, 'deletePosition'])->name('map.positions.delete');


    Route::get('/users', function () {
        return Inertia::render('Users');
    })->name('users');
    Route::get('/users', [UserController::class, 'index'])->name('users');
    Route::post('/users', [UserController::class, 'create'])->name('users.create');
    Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');


    // ... other admin routes
});


// Route::get('/dashboard', function () {
//     return Inertia::render('Dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
