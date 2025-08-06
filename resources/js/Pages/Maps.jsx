import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import { Users, Save, X, Plus, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for saved positions
const savedPositionIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill="#10B981" stroke="white" stroke-width="3"/>
            <path d="M15 8v14M8 15h14" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `),
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
});

// Component to pan the map and handle clicks
function MapController({ onMapClick, onPositionClick, savedPositions, selectedUserPosition }) {
    const map = useMap();

    // Pan to selected user's position when it changes
    useEffect(() => {
        if (selectedUserPosition) {
            map.setView([selectedUserPosition.latitude, selectedUserPosition.longitude], map.getZoom());
        }
    }, [selectedUserPosition, map]);

    // Handle map clicks to add new position
    useMapEvents({
        click: (e) => {
            onMapClick({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
            });
        }
    });

    return (
        <>
            {/* Saved positions markers and circles */}
            {savedPositions.map((position) => (
                <div key={position.id}>
                    <Marker
                        position={[position.latitude, position.longitude]}
                        icon={savedPositionIcon}
                        eventHandlers={{
                            click: () => onPositionClick(position)
                        }}
                    />
                    <Circle
                        center={[position.latitude, position.longitude]}
                        radius={position.radius}
                        pathOptions={{
                            color: '#10B981',
                            fillColor: '#10B981',
                            fillOpacity: 0.2,
                            weight: 2,
                            dashArray: '5, 5'
                        }}
                    />
                </div>
            ))}
        </>
    );
}

export default function Maps({ initialUsers, initialPositions }) {
    const { flash } = usePage().props;
    
    // // Debug logging
    // console.log('Maps component props:', { initialUsers, initialPositions });
    // console.log('Flash messages:', flash);
    
    const safeInitialUsers = Array.isArray(initialUsers) ? initialUsers : [];
    const safeInitialPositions = Array.isArray(initialPositions) ? initialPositions : [];
    
    const [users, setUsers] = useState(safeInitialUsers);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedUserPosition, setSelectedUserPosition] = useState(null);
    const [savedPositions, setSavedPositions] = useState(safeInitialPositions);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [newRadius, setNewRadius] = useState(100);
    const [isLoading, setIsLoading] = useState(false); // Start with false since we have initial data
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');


    // Handle flash messages
    useEffect(() => {
  
    if (flash?.success) {
        setMessage({ type: 'success', text: flash.success });
    } else if (flash?.error) {
        setMessage({ type: 'error', text: flash.error });
    }

  
    let timeout;
    if (message) {
        timeout = setTimeout(() => {
            setMessage('');
        }, 5000);
    }

    return () => clearTimeout(timeout);
}, [flash]); // The dependency array should only watch for `flash` changes.

    // Handle user selection from the header dropdown
    const handleUserSelect = (e) => {
        const userId = e.target.value;
        setSelectedUser(userId);

        if (userId) {
            const userPos = savedPositions.find(pos => pos.user_id === userId);
            if (userPos) {
                setSelectedUserPosition(userPos);
            } else {
                setSelectedUserPosition(null);
            }
        } else {
            setSelectedUserPosition(null);
        }

        // Close any open popups and reset selected position
        setShowPopup(false);
        setSelectedPosition(null);
    };

    // Handle map click to create a new position
    const handleMapClick = (clickedPosition) => {
        // Only open the popup if no position is currently selected
        if (!selectedPosition) {
            const newPosition = {
                id: Date.now(), // Temporary ID
                latitude: clickedPosition.latitude,
                longitude: clickedPosition.longitude,
                radius: 100,
                user_id: null,
                isNew: true
            };

            setSavedPositions(prev => [...prev, newPosition]);
            setSelectedPosition(newPosition);
            setNewRadius(100);
            setSelectedUser('');
            setShowPopup(true);
        }
    };

    // Handle click on an existing position
    const handlePositionClick = (position) => {
        setSelectedPosition(position);
        setNewRadius(position.radius);
        setSelectedUser(position.user_id?.toString() || '');
        setShowPopup(true);
    };

    // Save or update position to the database
    const handleSave = async () => {
        if (!selectedUser) {
            setMessage({ type: 'error', text: 'Please select a user' });
            return;
        }

        setIsSaving(true);

        const positionData = {
            latitude: selectedPosition.latitude,
            longitude: selectedPosition.longitude,
            radius: newRadius,
            user_id: selectedUser,
        };

        try {
            if (selectedPosition.isNew) {
                // Use Inertia's router.post for creating a new position
                router.post('/map-positions', positionData, {
                    onSuccess: () => {
                        setShowPopup(false);
                        setSelectedPosition(null);
                        setIsSaving(false);
                    },
                    onError: (errors) => {
                        console.error('Error creating position:', errors);
                        setIsSaving(false);
                    }
                });
            } else {
                // Use Inertia's router.put for updating an existing position
                router.put(`/map-positions/${selectedPosition.id}`, positionData, {
                    onSuccess: () => {
                        setShowPopup(false);
                        setSelectedPosition(null);
                        setIsSaving(false);
                    },
                    onError: (errors) => {
                        console.error('Error updating position:', errors);
                        setIsSaving(false);
                    }
                });
            }
        } catch (error) {
            console.error('An unexpected error occurred:', error);
            setIsSaving(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        if (selectedPosition?.isNew) {
            // Remove the new position from the local state if canceling
            setSavedPositions(prev => prev.filter(pos => pos.id !== selectedPosition.id));
        }
        setShowPopup(false);
        setSelectedPosition(null);
    };

    // Delete position
    const handleDelete = () => {
        if (!selectedPosition || selectedPosition.isNew) {
            handleCancel();
            return;
        }

        setIsSaving(true);

        router.delete(`/map-positions/${selectedPosition.id}`, {
            onSuccess: () => {
                setShowPopup(false);
                setSelectedPosition(null);
                setIsSaving(false);
            },
            onError: (errors) => {
                console.error('Error deleting position:', errors);
                setIsSaving(false);
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                      Maps
                    </h2>

                    {/* User Selection Dropdown */}
                    <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-gray-500" />
                        <select
                            value={selectedUser}
                            onChange={handleUserSelect}
                            className="block w-64 px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        >
                            <option value="">Select a user...</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id.toString()}>
                                    {user.username} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            }
        >
            <Head title="Maps" />

            

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Map Container */}
                        <div className="relative">
                            {isLoading ? (
                                <div className="w-full h-[600px] flex items-center justify-center bg-gray-100">
                                    <div className="flex items-center space-x-3">
                                        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
                                        <span className="text-gray-600 font-medium">Loading map data...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-[600px]">
                                    <MapContainer
                                        center={selectedUserPosition ? [selectedUserPosition.latitude, selectedUserPosition.longitude] : [48.8566, 2.3522]}
                                        zoom={16}
                                        style={{ height: '100%', width: '100%' }}
                                        className="rounded-t-2xl"
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <MapController
                                            onMapClick={handleMapClick}
                                            onPositionClick={handlePositionClick}
                                            savedPositions={savedPositions}
                                            selectedUserPosition={selectedUserPosition}
                                        />
                                    </MapContainer>
                                </div>
                            )}

                            {/* Instructions */}
                            {!isLoading && (
                                <div className="absolute top-4 right-4 bg-indigo-600 text-white text-sm px-4 py-3 rounded-lg shadow-lg z-[1000] max-w-xs">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Plus className="w-4 h-4" />
                                            <span className="font-medium">Click anywhere to add position</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="w-4 h-4" />
                                            <span className="font-medium">Click a green marker to edit</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Statistics */}
                            {!isLoading && (
                                <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm text-gray-800 text-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200 z-[1000]">
                                    <div className="space-y-1">
                                        <div>Saved User Positions: <span className="font-semibold text-green-600">{savedPositions.length}</span></div>
                                        <div className="font-mono text-xs text-gray-500">
                                            
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popup Modal */}
            {showPopup && selectedPosition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {selectedPosition.isNew ? 'New Position' : 'Edit Position'}
                                </h3>
                                <button
                                    onClick={handleCancel}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={isSaving}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6 space-y-6">
                            {/* User Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    User *
                                </label>
                                <select
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    disabled={isSaving}
                                >
                                    <option value="">Select a user...</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id.toString()}>
                                            {user.username}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Radius Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Radius *
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="number"
                                        value={newRadius}
                                        onChange={(e) => setNewRadius(Number(e.target.value))}
                                        min="10"
                                        max="5000"
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        placeholder="Enter radius"
                                        disabled={isSaving}
                                    />
                                    <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-3 rounded-lg">
                                        Metres
                                    </span>
                                </div>
                            </div>

                            {/* Position Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Position</h4>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <div>Latitude: {selectedPosition.latitude.toFixed(6)}</div>
                                    <div>Longitude: {selectedPosition.longitude.toFixed(6)}</div>
                                    {selectedPosition.user_id && (
                                        <div className="text-indigo-600 font-medium mt-2">
                                            Assigned to: {users.find(u => u.id === selectedPosition.user_id)?.username}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between">
                            <div>
                                {!selectedPosition.isNew && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSaving ? 'Deleting...' : 'Delete'}
                                    </button>
                                )}
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!selectedUser || isSaving || newRadius < 10}
                                    className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSaving ? 'Saving...' : 'Enregistrer'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}