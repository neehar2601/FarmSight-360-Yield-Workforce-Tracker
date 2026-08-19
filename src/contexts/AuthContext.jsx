import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    restoreSession,
    authenticateUser,
    registerUser,
    logoutUser,
    completeFirstLogin as markFirstLoginComplete,
    changePassword as updatePassword,
    updateUserProfile as updateProfile,
    addFarm as addNewFarm,
    updateFarm as updateExistingFarm,
    deleteFarm as removeFarm,
} from '../utils/authUtils';
import { tokenStore } from '../utils/apiClient';

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

    // ── Forced logout handler (fired by apiClient when refresh fails) ──────────
    const handleForcedLogout = useCallback(() => {
        setCurrentUser(null);
        setCurrentFarm(null);
        setIsAuthenticated(false);
    }, []);

    useEffect(() => {
        window.addEventListener('auth:logout', handleForcedLogout);
        return () => window.removeEventListener('auth:logout', handleForcedLogout);
    }, [handleForcedLogout]);

    // ── Restore session on app startup ────────────────────────────────────────
    useEffect(() => {
        const initAuth = async () => {
            try {
                const user = await restoreSession();
                if (user) {
                    setCurrentUser(user);
                    setIsAuthenticated(true);

                    // Restore last selected farm from localStorage (farm ID only)
                    const savedFarmId = localStorage.getItem('farm360_current_farm');
                    if (savedFarmId && user.farms) {
                        const farm = user.farms.find((f) => f.id === savedFarmId);
                        if (farm) setCurrentFarm(farm);
                    }
                    // Auto-select the only farm if there is just one
                    if (!currentFarm && user.farms?.length === 1) {
                        setCurrentFarm(user.farms[0]);
                        localStorage.setItem('farm360_current_farm', user.farms[0].id);
                    }
                }
            } catch (error) {
                console.error('Error restoring auth session:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Login ─────────────────────────────────────────────────────────────────
    const login = async (email, password) => {
        try {
            const result = await authenticateUser(email, password);

            if (!result.success) {
                return { success: false, error: result.error };
            }

            const user = result.user;
            setCurrentUser(user);
            setIsAuthenticated(true);

            // Auto-select single farm
            if (user.farms?.length === 1) {
                setCurrentFarm(user.farms[0]);
                localStorage.setItem('farm360_current_farm', user.farms[0].id);
                return { success: true, user, requiresFarmSelection: false, isFirstLogin: user.isFirstLogin };
            }

            return { success: true, user, requiresFarmSelection: true, isFirstLogin: user.isFirstLogin };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    // ── Register ──────────────────────────────────────────────────────────────
    const register = async (userData, farmData) => {
        try {
            const result = await registerUser(userData, farmData);

            if (!result.success) {
                return result;
            }

            const user = result.user;
            setCurrentUser(user);
            setIsAuthenticated(true);

            // Auto-select the newly created farm
            if (user.farms?.length > 0) {
                setCurrentFarm(user.farms[0]);
                localStorage.setItem('farm360_current_farm', user.farms[0].id);
            }

            return { success: true, user, isFirstLogin: true };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Registration failed. Please try again.' };
        }
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = async () => {
        try {
            await logoutUser();
            localStorage.removeItem('farm360_current_farm');
            setCurrentUser(null);
            setCurrentFarm(null);
            setIsAuthenticated(false);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            // Clear local state even if server call fails
            tokenStore.clear();
            localStorage.removeItem('farm360_current_farm');
            setCurrentUser(null);
            setCurrentFarm(null);
            setIsAuthenticated(false);
            return { success: false, error: 'Logout failed' };
        }
    };

    // ── Switch farm ───────────────────────────────────────────────────────────
    const switchFarm = (farmId) => {
        if (!currentUser) return { success: false, error: 'No user logged in' };

        const farm = currentUser.farms?.find((f) => f.id === farmId);
        if (!farm) return { success: false, error: 'Farm not found' };

        localStorage.setItem('farm360_current_farm', farmId);
        setCurrentFarm(farm);
        return { success: true, farm };
    };

    // ── Add farm ──────────────────────────────────────────────────────────────
    const addFarm = async (farmData) => {
        if (!currentUser) return { success: false, error: 'No user logged in' };

        const result = await addNewFarm(currentUser.id, farmData);
        if (!result.success) return result;

        // Refresh user data to get updated farms list
        // For now update optimistically (Phase 2 Farm Service will handle this properly)
        const updatedUser = { ...currentUser, farms: [...(currentUser.farms || []), result.farm] };
        setCurrentUser(updatedUser);

        return { success: true, farm: result.farm };
    };

    // ── Update farm ───────────────────────────────────────────────────────────
    const updateFarm = async (farmId, farmData) => {
        if (!currentUser) return { success: false, error: 'No user logged in' };

        const result = await updateExistingFarm(currentUser.id, farmId, farmData);
        if (!result.success) return result;

        const updatedFarms = (currentUser.farms || []).map((f) =>
            f.id === farmId ? result.farm : f
        );
        setCurrentUser({ ...currentUser, farms: updatedFarms });

        if (currentFarm?.id === farmId) {
            setCurrentFarm(result.farm);
        }

        return { success: true, farm: result.farm };
    };

    // ── Delete farm ───────────────────────────────────────────────────────────
    const deleteFarm = async (farmId) => {
        if (!currentUser) return { success: false, error: 'No user logged in' };

        const result = await removeFarm(currentUser.id, farmId);
        if (!result.success) return result;

        const updatedFarms = (currentUser.farms || []).filter((f) => f.id !== farmId);
        setCurrentUser({ ...currentUser, farms: updatedFarms });

        if (currentFarm?.id === farmId) {
            const nextFarm = updatedFarms[0] || null;
            setCurrentFarm(nextFarm);
            if (nextFarm) localStorage.setItem('farm360_current_farm', nextFarm.id);
            else localStorage.removeItem('farm360_current_farm');
        }

        return { success: true };
    };

    // ── Change password ───────────────────────────────────────────────────────
    const changePassword = async (currentPassword, newPassword) => {
        if (!currentUser) return { success: false, error: 'No user logged in' };
        return updatePassword(currentUser.id, currentPassword, newPassword);
    };

    // ── Update profile ────────────────────────────────────────────────────────
    const updateUserProfile = async (userData) => {
        if (!currentUser) return { success: false, error: 'No user logged in' };

        const result = await updateProfile(currentUser.id, userData);
        if (!result.success) return result;

        setCurrentUser({ ...currentUser, ...result.user, farms: currentUser.farms });
        return { success: true, user: result.user };
    };

    // ── Complete first login ───────────────────────────────────────────────────
    const completeFirstLogin = async () => {
        if (!currentUser) return false;

        const ok = await markFirstLoginComplete();
        if (ok) {
            setCurrentUser({ ...currentUser, isFirstLogin: false });
        }
        return ok;
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
        completeFirstLogin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
