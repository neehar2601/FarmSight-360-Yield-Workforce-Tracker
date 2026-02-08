import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    getCurrentUser,
    getCurrentFarm,
    setCurrentUser as saveCurrentUser,
    setCurrentFarm as saveCurrentFarm,
    authenticateUser,
    registerUser as registerNewUser,
    logoutUser as performLogout,
    addFarm as addNewFarm,
    updateFarm as updateExistingFarm,
    deleteFarm as removeFarm,
    changePassword as updatePassword,
    updateUserProfile as updateProfile,
    completeFirstLogin as markFirstLoginComplete,
    getUsers
} from '../utils/authUtils';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentFarm, setCurrentFarm] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = () => {
            try {
                const user = getCurrentUser();
                const farmId = getCurrentFarm();

                if (user && farmId) {
                    const farm = user.farms.find(f => f.id === farmId);
                    if (farm) {
                        setCurrentUser(user);
                        setCurrentFarm(farm);
                        setIsAuthenticated(true);
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // Login function
    const login = async (email, password) => {
        try {
            const user = authenticateUser(email, password);

            if (!user) {
                return { success: false, error: 'Invalid email or password' };
            }

            // Set current user
            saveCurrentUser(user.id);
            setCurrentUser(user);
            setIsAuthenticated(true);

            // If user has only one farm, auto-select it
            if (user.farms.length === 1) {
                const farm = user.farms[0];
                saveCurrentFarm(farm.id);
                setCurrentFarm(farm);
                return { success: true, user, requiresFarmSelection: false, isFirstLogin: user.isFirstLogin };
            }

            // Multiple farms - require selection
            return { success: true, user, requiresFarmSelection: true, isFirstLogin: user.isFirstLogin };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed' };
        }
    };

    // Register function
    const register = async (userData, farmData) => {
        try {
            const result = registerNewUser(userData, farmData);

            if (!result.success) {
                return result;
            }

            // Auto-login after registration
            setCurrentUser(result.user);
            setCurrentFarm(result.user.farms[0]);
            setIsAuthenticated(true);

            return { success: true, user: result.user, isFirstLogin: true };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Registration failed' };
        }
    };

    // Logout function
    const logout = () => {
        try {
            performLogout();
            setCurrentUser(null);
            setCurrentFarm(null);
            setIsAuthenticated(false);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: 'Logout failed' };
        }
    };

    // Switch farm
    const switchFarm = (farmId) => {
        try {
            if (!currentUser) {
                return { success: false, error: 'No user logged in' };
            }

            const farm = currentUser.farms.find(f => f.id === farmId);

            if (!farm) {
                return { success: false, error: 'Farm not found' };
            }

            saveCurrentFarm(farmId);
            setCurrentFarm(farm);

            return { success: true, farm };
        } catch (error) {
            console.error('Switch farm error:', error);
            return { success: false, error: 'Failed to switch farm' };
        }
    };

    // Add farm
    const addFarm = async (farmData) => {
        try {
            if (!currentUser) {
                return { success: false, error: 'No user logged in' };
            }

            const result = addNewFarm(currentUser.id, farmData);

            if (!result.success) {
                return result;
            }

            // Refresh current user
            const updatedUser = getCurrentUser();
            setCurrentUser(updatedUser);

            return { success: true, farm: result.farm };
        } catch (error) {
            console.error('Add farm error:', error);
            return { success: false, error: 'Failed to add farm' };
        }
    };

    // Update farm
    const updateFarm = async (farmId, farmData) => {
        try {
            if (!currentUser) {
                return { success: false, error: 'No user logged in' };
            }

            const result = updateExistingFarm(currentUser.id, farmId, farmData);

            if (!result.success) {
                return result;
            }

            // Refresh current user and farm
            const updatedUser = getCurrentUser();
            setCurrentUser(updatedUser);

            if (currentFarm && currentFarm.id === farmId) {
                setCurrentFarm(result.farm);
            }

            return { success: true, farm: result.farm };
        } catch (error) {
            console.error('Update farm error:', error);
            return { success: false, error: 'Failed to update farm' };
        }
    };

    // Delete farm
    const deleteFarm = async (farmId) => {
        try {
            if (!currentUser) {
                return { success: false, error: 'No user logged in' };
            }

            const result = removeFarm(currentUser.id, farmId);

            if (!result.success) {
                return result;
            }

            // Refresh current user and farm
            const updatedUser = getCurrentUser();
            setCurrentUser(updatedUser);

            const newFarmId = getCurrentFarm();
            const newFarm = updatedUser.farms.find(f => f.id === newFarmId);
            setCurrentFarm(newFarm);

            return { success: true };
        } catch (error) {
            console.error('Delete farm error:', error);
            return { success: false, error: 'Failed to delete farm' };
        }
    };

    // Change password
    const changePassword = async (currentPassword, newPassword) => {
        try {
            if (!currentUser) {
                return { success: false, error: 'No user logged in' };
            }

            const result = updatePassword(currentUser.id, currentPassword, newPassword);
            return result;
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, error: 'Failed to change password' };
        }
    };

    // Update user profile
    const updateUserProfile = async (userData) => {
        try {
            if (!currentUser) {
                return { success: false, error: 'No user logged in' };
            }

            const result = updateProfile(currentUser.id, userData);

            if (!result.success) {
                return result;
            }

            setCurrentUser(result.user);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: 'Failed to update profile' };
        }
    };

    // Complete first login
    const completeFirstLogin = () => {
        try {
            if (!currentUser) return false;

            const success = markFirstLoginComplete(currentUser.id);

            if (success) {
                const updatedUser = getCurrentUser();
                setCurrentUser(updatedUser);
            }

            return success;
        } catch (error) {
            console.error('Complete first login error:', error);
            return false;
        }
    };

    const value = {
        isAuthenticated,
        currentUser,
        currentFarm,
        loading,
        login,
        register,
        logout,
        switchFarm,
        addFarm,
        updateFarm,
        deleteFarm,
        changePassword,
        updateProfile: updateUserProfile,
        completeFirstLogin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
