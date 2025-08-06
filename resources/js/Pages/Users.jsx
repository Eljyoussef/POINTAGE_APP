
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, X, Save, Edit } from 'lucide-react';

export default function Users({ users = [] }) {
    const [showPopup, setShowPopup] = useState(false);
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!username.trim()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await router.post('/users', {
                username: username.trim()
            }, {
                onSuccess: () => {
                    handleCancel();
                },
                onError: (errors) => {
                    console.error('Error creating user:', errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Failed to create user:', error);
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setShowPopup(false);
        setUsername('');
        setIsSubmitting(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        // Reset previous errors
        setPasswordError('');
        
        // Validate passwords
        if (!newPassword.trim() || !confirmPassword.trim()) {
            setPasswordError('Both password fields are required.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long.');
            return;
        }

        setIsSubmitting(true);

        try {
            await router.put(`/users/${selectedUser.id}`, {
                user_id: selectedUser.id,
                new_password: newPassword
            }, {
                onSuccess: () => {
                    handlePasswordCancel();
                },
                onError: (errors) => {
                    console.error('Error updating password:', errors);
                    setPasswordError('Failed to update password. Please try again.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Failed to update password:', error);
            setPasswordError('Failed to update password. Please try again.');
            setIsSubmitting(false);
        }
    };

    const handlePasswordCancel = () => {
        setShowPasswordPopup(false);
        setSelectedUser(null);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setIsSubmitting(false);
    };

    const openPasswordPopup = (user) => {
        setSelectedUser(user);
        setShowPasswordPopup(true);
    };

    return (
   <AuthenticatedLayout
        header={
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Users
                </h2>
                <button
                    onClick={() => setShowPopup(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
                >
                    {/* Plus icon component would go here */}
                    <span>Ajouter User</span>
                </button>
            </div>
        }
    >
        <Head title="Users" />

           

            {/* Main Content */}
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        {users.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-500 text-lg mb-4">Aucun utilisateur trouvé</div>
                                <p className="text-gray-400">Commencez par ajouter votre premier utilisateur.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                N°
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Username
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Email
                                            </th>
                                           
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ajouté le
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((user, index) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </td>
                                                
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => openPasswordPopup(user)}
                                                        className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors duration-200"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        <span>Update</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add User Popup Modal */}
            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <form onSubmit={handleSave}>
                            <div className="flex justify-between items-center border-b p-6">
                                <h3 className="text-lg font-semibold text-gray-900">Ajouter un utilisateur</h3>
                                <button 
                                    type="button"
                                    onClick={handleCancel} 
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Entrez le nom d'utilisateur"
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <p className="mt-2 text-sm text-gray-500">
                                        L'email sera généré automatiquement: {username.toLowerCase()}@gmail.com
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex justify-end p-6 border-t space-x-3">
                                <button 
                                    type="button"
                                    onClick={handleCancel} 
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!username.trim() || isSubmitting}
                                    className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Enregistrement...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Enregistrer</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Update Popup Modal */}
            {showPasswordPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <form onSubmit={handleUpdatePassword}>
                            <div className="flex justify-between items-center border-b p-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Modifier le mot de passe - {selectedUser?.username}
                                </h3>
                                <button 
                                    type="button"
                                    onClick={handlePasswordCancel} 
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                {passwordError && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                        <p className="text-sm text-red-600">{passwordError}</p>
                                    </div>
                                )}
                                
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        New password
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Entrez le nouveau mot de passe"
                                        required
                                        disabled={isSubmitting}
                                        minLength={8}
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Confirmez le nouveau mot de passe"
                                        required
                                        disabled={isSubmitting}
                                        minLength={8}
                                    />
                                </div>
                                
                                <p className="text-sm text-gray-500">
                                    Le mot de passe doit contenir au moins 8 caractères.
                                </p>
                            </div>
                            
                            <div className="flex justify-end p-6 border-t space-x-3">
                                <button 
                                    type="button"
                                    onClick={handlePasswordCancel} 
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newPassword.trim() || !confirmPassword.trim() || isSubmitting}
                                    className="inline-flex items-center space-x-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Mise à jour...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Mettre à jour</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </AuthenticatedLayout>
    );
}