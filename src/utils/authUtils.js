/**
 * authUtils.js — Prototype Mock Implementation
 * Directly connects to mockStore with zero backend dependency.
 */

import { mockStore } from '../mock/mockStore';

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidPassword = (password) => password && password.length >= 6;
export const emailExists = (_email) => false;

export const restoreSession = async () => {
    // In prototype, automatically restore farmer session if in farmer role
    const user = mockStore.getCurrentUser();
    const farms = mockStore.getFarms();
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobile_number,
        isFirstLogin: false,
        profilePicture: user.avatar_url,
        role: user.role,
        farms: farms.map(f => ({
            id: f.id,
            name: f.name,
            location: f.location,
            area: f.total_area,
            areaUnit: f.area_unit,
            isActive: f.is_active,
        })),
    };
};

export const authenticateUser = async (email, password) => {
    const res = mockStore.login(email);
    if (res.error) return { success: false, error: res.error };
    const user = res.data;
    const farms = mockStore.getFarms();
    return {
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobile_number,
            isFirstLogin: false,
            profilePicture: user.avatar_url,
            farms,
        },
    };
};

export const registerUser = async (userData) => {
    const user = {
        name: userData.name,
        email: userData.email,
        farmName: userData.farmName,
    };
    mockStore.createFarm({ name: userData.farmName, location: userData.farmLocation });
    return { success: true, user };
};

export const logoutUser = async () => {
    return { success: true };
};

export const sendOtp = async () => ({ success: true, message: 'OTP sent to email' });
export const verifyOtp = async () => ({ success: true });
export const resetPassword = async () => ({ success: true, message: 'Password reset successfully' });
export const completeFirstLogin = async () => ({ success: true });
export const changePassword = async () => ({ success: true });
export const updateUserProfile = async (_userId, profileData) => {
    const user = mockStore.getCurrentUser();
    if (profileData.name) user.name = profileData.name;
    mockStore.saveState();
    return { success: true, user };
};
export const uploadAvatar = async () => ({ success: true, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' });
export const deleteUserAccount = async () => ({ success: true });
