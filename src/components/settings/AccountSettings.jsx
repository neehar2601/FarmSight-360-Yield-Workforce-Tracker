import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AccountSettings = ({ onClose }) => {
    const { currentUser, currentFarm, updateProfile, changePassword, addFarm, updateFarm, deleteFarm, switchFarm } = useAuth();
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password', 'farms'
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile Edit State
    const [profileData, setProfileData] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        profilePicture: currentUser?.profilePicture || ''
    });
    const [profileErrors, setProfileErrors] = useState({});
    const [profilePicturePreview, setProfilePicturePreview] = useState(currentUser?.profilePicture || '');
    const fileInputRef = React.useRef(null);

    // Password Change State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({});

    // Farm Management State
    const [showAddFarm, setShowAddFarm] = useState(false);
    const [editingFarm, setEditingFarm] = useState(null);
    const [farmData, setFarmData] = useState({
        name: '',
        location: '',
        area: '',
        areaUnit: 'acres'
    });
    const [farmErrors, setFarmErrors] = useState({});

    // Clear message after 5 seconds
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // Profile Picture Handlers
    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showMessage('error', 'Please select a valid image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showMessage('error', 'Image size must be less than 5MB');
                return;
            }

            // Read file and convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setProfilePicturePreview(base64String);
                setProfileData(prev => ({ ...prev, profilePicture: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveProfilePicture = () => {
        setProfilePicturePreview('');
        setProfileData(prev => ({ ...prev, profilePicture: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // Profile Update Handlers
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        if (profileErrors[name]) {
            setProfileErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateProfile = () => {
        const errors = {};
        if (!profileData.name.trim()) {
            errors.name = 'Name is required';
        }
        if (!profileData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
            errors.email = 'Invalid email format';
        }
        setProfileErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (!validateProfile()) return;

        setIsLoading(true);
        const result = await updateProfile(profileData);
        setIsLoading(false);

        if (result.success) {
            showMessage('success', 'Profile updated successfully!');
        } else {
            showMessage('error', result.error || 'Failed to update profile');
        }
    };

    // Password Change Handlers
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validatePassword = () => {
        const errors = {};
        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }
        if (!passwordData.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 6) {
            errors.newPassword = 'Password must be at least 6 characters';
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!validatePassword()) return;

        setIsLoading(true);
        const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
        setIsLoading(false);

        if (result.success) {
            showMessage('success', 'Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            showMessage('error', result.error || 'Failed to change password');
        }
    };

    // Farm Management Handlers
    const handleFarmChange = (e) => {
        const { name, value } = e.target;
        setFarmData(prev => ({ ...prev, [name]: value }));
        if (farmErrors[name]) {
            setFarmErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateFarm = () => {
        const errors = {};
        if (!farmData.name.trim()) {
            errors.name = 'Farm name is required';
        }
        if (!farmData.location.trim()) {
            errors.location = 'Location is required';
        }
        if (!farmData.area || isNaN(farmData.area) || parseFloat(farmData.area) <= 0) {
            errors.area = 'Valid area is required';
        }
        setFarmErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddFarm = async (e) => {
        e.preventDefault();
        if (!validateFarm()) return;

        setIsLoading(true);
        const result = await addFarm({
            name: farmData.name,
            location: farmData.location,
            area: parseFloat(farmData.area),
            areaUnit: farmData.areaUnit
        });
        setIsLoading(false);

        if (result.success) {
            showMessage('success', 'Farm added successfully!');
            setShowAddFarm(false);
            setFarmData({ name: '', location: '', area: '', areaUnit: 'acres' });
        } else {
            showMessage('error', result.error || 'Failed to add farm');
        }
    };

    const handleEditFarm = async (e) => {
        e.preventDefault();
        if (!validateFarm()) return;

        setIsLoading(true);
        const result = await updateFarm(editingFarm.id, {
            name: farmData.name,
            location: farmData.location,
            area: parseFloat(farmData.area),
            areaUnit: farmData.areaUnit
        });
        setIsLoading(false);

        if (result.success) {
            showMessage('success', 'Farm updated successfully!');
            setEditingFarm(null);
            setFarmData({ name: '', location: '', area: '', areaUnit: 'acres' });
        } else {
            showMessage('error', result.error || 'Failed to update farm');
        }
    };

    const handleDeleteFarm = async (farmId) => {
        if (!confirm('Are you sure you want to delete this farm? This action cannot be undone.')) {
            return;
        }

        setIsLoading(true);
        const result = await deleteFarm(farmId);
        setIsLoading(false);

        if (result.success) {
            showMessage('success', 'Farm deleted successfully!');
        } else {
            showMessage('error', result.error || 'Failed to delete farm');
        }
    };

    const handleSwitchFarm = async (farmId) => {
        setIsLoading(true);
        const result = await switchFarm(farmId);
        setIsLoading(false);

        if (result.success) {
            showMessage('success', 'Switched to farm successfully!');
        } else {
            showMessage('error', result.error || 'Failed to switch farm');
        }
    };

    const startEditFarm = (farm) => {
        setEditingFarm(farm);
        setFarmData({
            name: farm.name,
            location: farm.location,
            area: farm.area.toString(),
            areaUnit: farm.areaUnit
        });
        setShowAddFarm(false);
    };

    const cancelFarmEdit = () => {
        setEditingFarm(null);
        setShowAddFarm(false);
        setFarmData({ name: '', location: '', area: '', areaUnit: 'acres' });
        setFarmErrors({});
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Account Settings</h1>
                            <p className="text-gray-600 mt-1">Manage your profile and farm information</p>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Message Display */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 px-6 py-4 font-medium ${activeTab === 'profile'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`flex-1 px-6 py-4 font-medium ${activeTab === 'password'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Password
                        </button>
                        <button
                            onClick={() => setActiveTab('farms')}
                            className={`flex-1 px-6 py-4 font-medium ${activeTab === 'farms'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Farms
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>

                                {/* Profile Picture Section */}
                                <div className="flex items-center space-x-6 pb-6 border-b border-gray-200">
                                    <div className="relative">
                                        <img
                                            src={profilePicturePreview || `https://i.pravatar.cc/150?u=${currentUser?.name}`}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                                        />
                                        {profilePicturePreview && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveProfilePicture}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                title="Remove picture"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Profile Picture</h3>
                                        <p className="text-xs text-gray-500 mb-3">JPG, PNG or GIF. Max size 5MB.</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfilePictureChange}
                                            className="hidden"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={triggerFileInput}
                                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                Upload Picture
                                            </button>
                                            {profilePicturePreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveProfilePicture}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={profileData.name}
                                        onChange={handleProfileChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${profileErrors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={isLoading}
                                    />
                                    {profileErrors.name && (
                                        <p className="mt-1 text-sm text-red-600">{profileErrors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleProfileChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${profileErrors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={isLoading}
                                    />
                                    {profileErrors.email && (
                                        <p className="mt-1 text-sm text-red-600">{profileErrors.email}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Updating...' : 'Update Profile'}
                                </button>
                            </form>
                        )}

                        {/* Password Tab */}
                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>

                                <div>
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={isLoading}
                                    />
                                    {passwordErrors.currentPassword && (
                                        <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={isLoading}
                                    />
                                    {passwordErrors.newPassword && (
                                        <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={isLoading}
                                    />
                                    {passwordErrors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Changing...' : 'Change Password'}
                                </button>
                            </form>
                        )}

                        {/* Farms Tab */}
                        {activeTab === 'farms' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-gray-800">Your Farms</h2>
                                    {!showAddFarm && !editingFarm && (
                                        <button
                                            onClick={() => setShowAddFarm(true)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium transition-colors"
                                        >
                                            + Add New Farm
                                        </button>
                                    )}
                                </div>

                                {/* Add/Edit Farm Form */}
                                {(showAddFarm || editingFarm) && (
                                    <form onSubmit={editingFarm ? handleEditFarm : handleAddFarm} className="bg-gray-50 p-4 rounded-lg space-y-4">
                                        <h3 className="font-semibold text-gray-800">
                                            {editingFarm ? 'Edit Farm' : 'Add New Farm'}
                                        </h3>

                                        <div>
                                            <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-1">
                                                Farm Name
                                            </label>
                                            <input
                                                type="text"
                                                id="farmName"
                                                name="name"
                                                value={farmData.name}
                                                onChange={handleFarmChange}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${farmErrors.name ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                disabled={isLoading}
                                            />
                                            {farmErrors.name && (
                                                <p className="mt-1 text-sm text-red-600">{farmErrors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="farmLocation" className="block text-sm font-medium text-gray-700 mb-1">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                id="farmLocation"
                                                name="location"
                                                value={farmData.location}
                                                onChange={handleFarmChange}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${farmErrors.location ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                disabled={isLoading}
                                            />
                                            {farmErrors.location && (
                                                <p className="mt-1 text-sm text-red-600">{farmErrors.location}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="farmArea" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Area
                                                </label>
                                                <input
                                                    type="number"
                                                    id="farmArea"
                                                    name="area"
                                                    value={farmData.area}
                                                    onChange={handleFarmChange}
                                                    step="0.01"
                                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${farmErrors.area ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                    disabled={isLoading}
                                                />
                                                {farmErrors.area && (
                                                    <p className="mt-1 text-sm text-red-600">{farmErrors.area}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="areaUnit" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unit
                                                </label>
                                                <select
                                                    id="areaUnit"
                                                    name="areaUnit"
                                                    value={farmData.areaUnit}
                                                    onChange={handleFarmChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    disabled={isLoading}
                                                >
                                                    <option value="acres">Acres</option>
                                                    <option value="hectares">Hectares</option>
                                                    <option value="sq_ft">Square Feet</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium transition-colors disabled:opacity-50"
                                            >
                                                {isLoading ? 'Saving...' : (editingFarm ? 'Update Farm' : 'Add Farm')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelFarmEdit}
                                                disabled={isLoading}
                                                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium transition-colors disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Farms List */}
                                <div className="space-y-4">
                                    {currentUser?.farms?.map((farm) => (
                                        <div
                                            key={farm.id}
                                            className={`border rounded-lg p-4 ${farm.id === currentFarm?.id ? 'border-green-500 bg-green-50' : 'border-gray-300'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-semibold text-gray-800">{farm.name}</h3>
                                                        {farm.id === currentFarm?.id && (
                                                            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Active</span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 mt-1">
                                                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {farm.location}
                                                    </p>
                                                    <p className="text-gray-600 mt-1">
                                                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                                                        </svg>
                                                        {farm.area} {farm.areaUnit}
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    {farm.id !== currentFarm?.id && (
                                                        <button
                                                            onClick={() => handleSwitchFarm(farm.id)}
                                                            disabled={isLoading}
                                                            className="text-green-600 hover:text-green-700 px-3 py-1 border border-green-600 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                                                        >
                                                            Switch
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => startEditFarm(farm)}
                                                        disabled={isLoading}
                                                        className="text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    {currentUser?.farms?.length > 1 && (
                                                        <button
                                                            onClick={() => handleDeleteFarm(farm.id)}
                                                            disabled={isLoading || farm.id === currentFarm?.id}
                                                            className="text-red-600 hover:text-red-700 px-3 py-1 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                                            title={farm.id === currentFarm?.id ? 'Cannot delete active farm' : 'Delete farm'}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
