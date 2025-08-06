<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;


use Inertia\Inertia;

class UserController extends Controller
{
    public function userLogin(Request $request)
    {
        // Validate the incoming request data
        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // Find the user by their username
        $user = User::where('username', $request->username)->first();

        // Check if the user exists and the provided password matches the hashed password
        if ($user && Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'User Found',
                'user_id' => $user->id
            ]);
        } else {
            // Return an error message for either incorrect username or password
            return response()->json([
                'message' => 'Invalid User'
            ], 401); 
        }
    }
   public function index()
    {
        Log::info('Maps index method called');
        
        if (!Auth::guard('admin')->check()) {
            Log::info('Admin not authenticated, redirecting to login');
            return redirect('/');
        }

        $adminId = Auth::guard('admin')->id();
        Log::info('Admin authenticated with ID: ' . $adminId);

        // Get users for this admin
        $users = User::where('id_admin', $adminId)->get();
        
        $users->makeHidden(['password']);
      
        
        // Debug logging
        Log::info('Maps page data', [
            'adminId' => $adminId,
            'usersCount' => $users->count(),
            'users' => $users->toArray(),
        ]);
        
        // Pass data to the React component - always pass arrays even if empty
        return Inertia::render('Users', [
            'users' => $users->toArray(),
        ]);
    }



    public function create(Request $request)
    {

        if (!Auth::guard('admin')->check()) {
            Log::warning('Unauthorized attempt to create a user');
            return redirect('/');
        }

        $adminId = Auth::guard('admin')->id();

        $request->validate([
            'username' => ['required', 'string', 'max:255', 'unique:users'],
        ]);
        
        $username = $request->input('username');
        Log::info('Validated username received: ' . $username);


        $generatedPassword = Str::random(12);
        $hashedPassword = Hash::make($generatedPassword);

        Log::info('Generated and hashed a new password.');

        try {
            $user = new User();
            $user->id_admin = $adminId;
            $user->username = $username;

            $user->email = strtolower($username) . '@gmail.com'; 
            $user->password = $hashedPassword;

            $user->save();
            
            Log::info('New user created successfully', ['user_id' => $user->id]);

            // 5. Redirect with a success flash message
            return redirect()->route('users')->with('success', 'User ' . $username . ' created successfully!');
        
        } catch (\Exception $e) {
            Log::error('Failed to create new user', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Failed to create user. Please try again.');
        }
    }

    public function update(Request $request)
    {

        if (!Auth::guard('admin')->check()) {
            Log::warning('Unauthorized attempt to update a user password');
            return redirect('/');
        }

        $adminId = Auth::guard('admin')->id();
        Log::info('Admin authenticated with ID: ' . $adminId);

        $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,id'],
            'new_password' => ['required', 'string', 'min:8'],
        ]);
        
        $userId = $request->input('user_id');
        $newPassword = $request->input('new_password');

        

        try {
            // 3. Find the user by their ID
            $user = User::findOrFail($userId);
            
            // 4. Check if the user belongs to the current admin for an extra layer of security
            if ($user->id_admin !== $adminId) {
                Log::warning('Admin attempted to update password for a user they do not own.', [
                    'admin_id' => $adminId,
                    'user_id' => $userId
                ]);
                return redirect()->back()->with('error', 'You do not have permission to update this user.');
            }

            // 5. Hash the new password before saving it
            $user->password = Hash::make($newPassword);
            $user->save();
            
            Log::info('User password updated successfully', ['user_id' => $user->id]);

            // 6. Redirect with a success flash message
            return redirect()->route('users')->with('success', 'User password updated successfully!');
        
        } catch (\Exception $e) {
            Log::error('Failed to update user password', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Failed to update user password. Please try again.');
        }
    }
}
