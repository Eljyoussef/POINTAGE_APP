<?php

namespace App\Http\Controllers;
use Inertia\Inertia;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

use App\Models\Admin;
use App\Models\User;
use App\Models\AreaMap;

class MapController extends Controller
{
    
    public function index()
    {
        Log::info('Maps index method called');
        
        if (!Auth::guard('admin')->check()) {
            Log::info('Admin not authenticated, redirecting to login');
            return redirect('/');
        }

        $adminId = Auth::guard('admin')->id();
        Log::info('Admin authenticated with ID: ' . $adminId);

        $users = User::where('id_admin', $adminId)->get();
        
        // Get area maps (positions) for this admin's users
        $positions = collect(); // Start with empty collection
        if ($users->count() > 0) {
            $positions = AreaMap::whereIn('user_id', $users->pluck('id'))->get();
        }
        
        // Debug logging
        Log::info('Maps page data', [
            'adminId' => $adminId,
            'usersCount' => $users->count(),
            'positionsCount' => $positions->count(),
            'users' => $users->toArray(),
            'positions' => $positions->toArray()
        ]);
        
        return Inertia::render('Maps', [
            'initialUsers' => $users->toArray(),
            'initialPositions' => $positions->toArray()
        ]);
    }
    
    
    public function usersPositions(Request $request)
    {
        if (!Auth::guard('admin')->check()) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $adminId = Auth::guard('admin')->id();

        // Get users for this admin
        $users = User::where('id_admin', $adminId)->get();
        
        // Get area maps (positions) for this admin's users
        $positions = AreaMap::whereIn('user_id', $users->pluck('id'))->get();
        
        // Return the data structure that the React component expects
        return response()->json([
            'users' => $users,
            'positions' => $positions
        ]);
    }

   
    public function affectePosition(Request $request)
    {
        if (!Auth::guard('admin')->check()) {
            return back()->withErrors(['error' => 'Unauthenticated.']);
        }

        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius' => 'required|numeric|min:10|max:5000',
            'user_id' => 'required|string|exists:users,id',
        ]);

        $adminId = Auth::guard('admin')->id();

        // Verify the user belongs to this admin
        $user = User::where('id', $request->user_id)
                   ->where('id_admin', $adminId)
                   ->first();

        if (!$user) {
            return back()->withErrors(['error' => 'User not found or unauthorized.']);
        }

        // Check if user already has a position
        $existingPosition = AreaMap::where('user_id', $request->user_id)->first();

        if ($existingPosition) {
            // Update existing position
            $existingPosition->update([
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'radius' => $request->radius,
            ]);

            return back()->with('success', 'Position updated successfully.');
        } else {
            // Create new position
            $newPosition = AreaMap::create([
                'user_id' => $request->user_id,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'radius' => $request->radius,
            ]);

            return back()->with('success', 'Position created successfully.');
        }
    }

    public function updateUserRadius(Request $request, $positionId)
    {
        if (!Auth::guard('admin')->check()) {
            return back()->withErrors(['error' => 'Unauthenticated.']);
        }

        $request->validate([
            'radius' => 'required|numeric|min:10|max:5000',
        ]);

        $adminId = Auth::guard('admin')->id();

        // Find the position and verify it belongs to this admin's users
        $position = AreaMap::whereHas('user', function($query) use ($adminId) {
            $query->where('id_admin', $adminId);
        })->find($positionId);

        if (!$position) {
            return back()->withErrors(['error' => 'Position not found or unauthorized.']);
        }

        $position->update([
            'radius' => $request->radius,
        ]);

        return back()->with('success', 'Radius updated successfully.');
    }

    
    public function deletePosition($positionId)
    {
        if (!Auth::guard('admin')->check()) {
            return back()->withErrors(['error' => 'Unauthenticated.']);
        }

        $adminId = Auth::guard('admin')->id();

        // Find the position and verify it belongs to this admin's users
        $position = AreaMap::whereHas('user', function($query) use ($adminId) {
            $query->where('id_admin', $adminId);
        })->find($positionId);

        if (!$position) {
            return back()->withErrors(['error' => 'Position not found or unauthorized.']);
        }

        $position->delete();

        return back()->with('success', 'Position deleted successfully.');
    }
}
