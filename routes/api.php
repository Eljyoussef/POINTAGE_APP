<?php

use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/userlogin', [UserController::class, 'userLogin'])->name('user.login');
Route::post('/testlogin', function () {
    return response()->json(['ok' => true]);
}); 

