/**
 * authUtils.js
 *
 * Thin wrappers around the Auth Microservice REST API.
 * All token storage is delegated to apiClient.tokenStore.
 *
 * These functions preserve the same signatures that AuthContext.jsx expects,
 * so the rest of the app (LoginPage, RegisterPage, FarmSelector, etc.) is
 * unchanged.
 */

import api, { tokenStore } from './apiClient';

// ── Validators (kept client-side for fast UX feedback) ────────────────────────

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidPassword = (password) => password && password.length >= 6;

/**
 * Client-side email existence check.
 * Always returns false — the real duplicate check is performed server-side
 * (POST /auth/register returns 409 if the email is already registered).
 * Kept here so existing components that import it don't break.
 */
export const emailExists = (_email) => false;

// ── Session helpers ───────────────────────────────────────────────────────────

/**
 * Restore session on app startup.
 * Calls GET /auth/me with the stored access token (auto-refreshes if needed).
 * Returns the full user object (with farms) or null.
 */
export const restoreSession = async () => {
    if (!tokenStore.getAccess() && !tokenStore.getRefresh()) return null;
    try {
        const { user } = await api.get('/auth/me');
        return user; // { id, name, email, isFirstLogin, farms }
    } catch {
        // Both tokens invalid / expired — clear storage
        tokenStore.clear();
        return null;
    }
};

/**
 * Authenticate with email + password.
 * Returns { success, user, accessToken, refreshToken, error? }
 */
export const authenticateUser = async (email, password) => {
    try {
        const data = await api.post('/auth/login', { email, password });
        tokenStore.setAccess(data.accessToken);
        tokenStore.setRefresh(data.refreshToken);
        return { success: true, user: data.user };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

/**
 * Register a new user + their first farm.
 * userData: { name, email, password }
 * farmData: { name, location?, area?, areaUnit? }
 */
export const registerUser = async (userData, farmData) => {
    try {
        const data = await api.post('/auth/register', {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            farmName: farmData.name,
            farmLocation: farmData.location,
            farmArea: farmData.area,
            farmAreaUnit: farmData.areaUnit,
        });
        tokenStore.setAccess(data.accessToken);
        tokenStore.setRefresh(data.refreshToken);
        return { success: true, user: data.user };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

/**
 * Logout — invalidates the refresh token on the server.
 */
export const logoutUser = async () => {
    try {
        const refreshToken = tokenStore.getRefresh();
        if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
        }
    } finally {
        tokenStore.clear();
    }
};

/**
 * Mark first-login as complete.
 */
export const completeFirstLogin = async () => {
    try {
        await api.post('/auth/complete-first-login', {});
        return true;
    } catch {
        return false;
    }
};

/**
 * Change the current user's password.
 */
export const changePassword = async (_userId, currentPassword, newPassword) => {
    try {
        await api.post('/auth/change-password', { currentPassword, newPassword });
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

/**
 * Update the current user's profile (name only; email changes not supported).
 */
export const updateUserProfile = async (_userId, userData) => {
    try {
        const { user } = await api.put('/auth/profile', { name: userData.name });
        return { success: true, user };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

// ── Farm operations ───────────────────────────────────────────────────────────
// Farm CRUD will move to a dedicated Farm Service later.
// For now these hit the same auth service which returns farm data alongside
// the user object, so we derive farm state from the user returned by /auth/me.
// Placeholder stubs are provided so AuthContext imports don't break.

export const addFarm = async (_userId, _farmData) => {
    // TODO: implement via Farm Service (Phase 2)
    return { success: false, error: 'Farm management not yet available via API' };
};

export const updateFarm = async (_userId, _farmId, _farmData) => {
    // TODO: implement via Farm Service (Phase 2)
    return { success: false, error: 'Farm management not yet available via API' };
};

export const deleteFarm = async (_userId, _farmId) => {
    // TODO: implement via Farm Service (Phase 2)
    return { success: false, error: 'Farm management not yet available via API' };
};

// ── Legacy localStorage helpers (kept as no-ops for compatibility) ────────────
// AuthContext no longer uses these — session state is derived from /auth/me.
export const getCurrentUser = () => null;
export const getCurrentFarm = () => null;
export const setCurrentUser = () => {};
export const setCurrentFarm = () => {};
export const getUsers = () => [];
