<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Add debugging
        Log::info('Login attempt', [
            'email' => $request->email,
            'guard' => 'admin'
        ]);

        $request->authenticate();

        $request->session()->regenerate();

        Log::info('Login successful', [
            'user' => Auth::guard('admin')->user()->email
        ]);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Add debugging
        Log::info('Logout attempt', [
            'user' => Auth::guard('admin')->user()?->email ?? 'No user',
            'guard' => 'admin'
        ]);

        Auth::guard('admin')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        Log::info('Logout successful - session destroyed');

        return redirect('/');
    }
}
