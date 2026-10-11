/**
 * spApi.js
 *
 * Dedicated client for the Service Provider Marketplace service (/api/sp).
 * Handles:
 *  • Service Provider authentication and token management (isolated from farm users)
 *  • Farm user booking client (hold, confirm, release, cancel, my bookings)
 *  • Service listing, calendar availability, and date blocking
 */

import { tokenStore as farmTokenStore } from './apiClient';

const SP_ACCESS_TOKEN_KEY = 'farm360_sp_access_token';
const SP_REFRESH_TOKEN_KEY = 'farm360_sp_refresh_token';
const SP_USER_KEY = 'farm360_sp_user';

export const spTokenStore = {
    getAccess: () => localStorage.getItem(SP_ACCESS_TOKEN_KEY),
    setAccess: (t) => localStorage.setItem(SP_ACCESS_TOKEN_KEY, t),
    getRefresh: () => localStorage.getItem(SP_REFRESH_TOKEN_KEY),
    setRefresh: (t) => localStorage.setItem(SP_REFRESH_TOKEN_KEY, t),
    getUser: () => {
        try {
            const raw = localStorage.getItem(SP_USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },
    setUser: (u) => localStorage.setItem(SP_USER_KEY, JSON.stringify(u)),
    clear: () => {
        localStorage.removeItem(SP_ACCESS_TOKEN_KEY);
        localStorage.removeItem(SP_REFRESH_TOKEN_KEY);
        localStorage.removeItem(SP_USER_KEY);
    },
};

const BASE_URL = '/api/sp';

let isRefreshingSp = false;

/**
 * Standard fetch wrapper for Service Provider routes (using SP tokens).
 */
const spRequest = async (path, options = {}, _retry = false) => {
    const url = `${BASE_URL}${path}`;
    const accessToken = spTokenStore.getAccess();

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 && !_retry && !isRefreshingSp && spTokenStore.getAccess()) {
        const refreshToken = spTokenStore.getRefresh();
        if (!refreshToken) {
            spTokenStore.clear();
            window.dispatchEvent(new Event('sp:logout'));
            throw new Error('SP session expired. Please log in again.');
        }

        isRefreshingSp = true;
        try {
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!refreshRes.ok) {
                spTokenStore.clear();
                window.dispatchEvent(new Event('sp:logout'));
                throw new Error('SP session expired. Please log in again.');
            }

            const { accessToken: newAccess, refreshToken: newRefresh } = await refreshRes.json();
            spTokenStore.setAccess(newAccess);
            if (newRefresh) spTokenStore.setRefresh(newRefresh);

            return spRequest(path, options, true);
        } finally {
            isRefreshingSp = false;
        }
    }

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : null;

    if (!res.ok) {
        const error = new Error(data?.error || `Request failed with status ${res.status}`);
        error.status = res.status;
        error.code = data?.code;
        error.data = data;
        throw error;
    }

    return data;
};

/**
 * Fetch wrapper for Farm User calling SP Marketplace (using farmer access token).
 */
const farmUserSpRequest = async (path, options = {}) => {
    const url = `${BASE_URL}${path}`;
    const accessToken = farmTokenStore.getAccess();

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : null;

    if (!res.ok) {
        const error = new Error(data?.error || `Request failed with status ${res.status}`);
        error.status = res.status;
        error.code = data?.code;
        error.data = data;
        throw error;
    }

    return data;
};

// ── Public / Browsing API ───────────────────────────────────────────────────

export const spPublicApi = {
    listProviders: async (params = {}) => {
        const search = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') search.append(k, v);
        });
        const qs = search.toString();
        const res = await fetch(`${BASE_URL}/providers${qs ? `?${qs}` : ''}`);
        if (!res.ok) throw new Error('Failed to load service providers');
        return res.json();
    },

    getProvider: async (id) => {
        const res = await fetch(`${BASE_URL}/providers/${id}`);
        if (!res.ok) throw new Error('Failed to load provider details');
        return res.json();
    },

    getProviderServices: async (id) => {
        const res = await fetch(`${BASE_URL}/providers/${id}/services`);
        if (!res.ok) throw new Error('Failed to load services');
        return res.json();
    },

    getProviderAvailability: async (id, from, to) => {
        const res = await fetch(`${BASE_URL}/providers/${id}/availability?from=${from}&to=${to}`);
        if (!res.ok) throw new Error('Failed to load availability');
        return res.json();
    },

    getMonthCalendar: async (id, month) => {
        const res = await fetch(`${BASE_URL}/calendar/${id}${month ? `?month=${month}` : ''}`);
        if (!res.ok) throw new Error('Failed to load month calendar');
        return res.json();
    },

    listCategories: async () => {
        const res = await fetch(`${BASE_URL}/services/categories`);
        if (!res.ok) throw new Error('Failed to load service categories');
        return res.json();
    },
};

// ── Farm User Booking API ───────────────────────────────────────────────────

export const spFarmerBookingApi = {
    // 1. Create ticket-style hold
    createHold: async ({ serviceId, startDate, endDate, workersNeeded, quantity, farmId, notes }) => {
        return farmUserSpRequest('/bookings/hold', {
            method: 'POST',
            body: JSON.stringify({ serviceId, startDate, endDate, workersNeeded, quantity, farmId, notes }),
        });
    },

    // 2. Confirm held booking
    confirmHold: async (bookingId, { notes, farmId } = {}) => {
        return farmUserSpRequest(`/bookings/${bookingId}/confirm`, {
            method: 'POST',
            body: JSON.stringify({ notes, farmId }),
        });
    },

    // 3. Release/abandon hold
    releaseHold: async (bookingId) => {
        return farmUserSpRequest(`/bookings/${bookingId}/hold`, {
            method: 'DELETE',
        });
    },

    // 4. Cancel active/confirmed booking
    cancelBooking: async (bookingId, reason) => {
        return farmUserSpRequest(`/bookings/${bookingId}/cancel`, {
            method: 'PATCH',
            body: JSON.stringify({ reason }),
        });
    },

    // 5. Farmer's booking list
    listMyBookings: async (status) => {
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';
        return farmUserSpRequest(`/bookings/my${qs}`);
    },

    // 6. Get booking detail
    getBooking: async (bookingId) => {
        return farmUserSpRequest(`/bookings/${bookingId}`);
    },
};

// ── Service Provider Auth & Portal API ──────────────────────────────────────

export const spProviderApi = {
    register: async (payload) => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        spTokenStore.setAccess(data.accessToken);
        spTokenStore.setRefresh(data.refreshToken);
        spTokenStore.setUser(data.sp);
        return data;
    },

    login: async (email, password) => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        spTokenStore.setAccess(data.accessToken);
        spTokenStore.setRefresh(data.refreshToken);
        spTokenStore.setUser(data.sp);
        return data;
    },

    logout: async () => {
        const refreshToken = spTokenStore.getRefresh();
        try {
            await spRequest('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            });
        } catch (e) {
            console.warn('SP logout call warning:', e);
        } finally {
            spTokenStore.clear();
            window.dispatchEvent(new Event('sp:logout'));
        }
    },

    getMe: async () => {
        const data = await spRequest('/auth/me');
        if (data?.sp) spTokenStore.setUser(data.sp);
        return data;
    },

    changePassword: async (currentPassword, newPassword) => {
        return spRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },

    // Profile & Capacity
    updateProfile: async (spId, data) => {
        const res = await spRequest(`/providers/${spId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (res?.sp) spTokenStore.setUser(res.sp);
        return res;
    },

    // Services CRUD
    listMyServices: async () => {
        return spRequest('/services/mine');
    },

    createService: async (serviceData) => {
        return spRequest('/services', {
            method: 'POST',
            body: JSON.stringify(serviceData),
        });
    },

    updateService: async (id, serviceData) => {
        return spRequest(`/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(serviceData),
        });
    },

    deleteService: async (id) => {
        return spRequest(`/services/${id}`, {
            method: 'DELETE',
        });
    },

    // SP Bookings Management
    listBookings: async (status) => {
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';
        return spRequest(`/bookings/sp/mine${qs}`);
    },

    updateBookingStatus: async (bookingId, status, reason) => {
        return spRequest(`/bookings/${bookingId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, reason }),
        });
    },

    // Calendar & Blocking
    getMyCalendar: async (month) => {
        const qs = month ? `?month=${encodeURIComponent(month)}` : '';
        return spRequest(`/calendar/mine${qs}`);
    },

    blockDates: async ({ from, to, reason }) => {
        return spRequest('/calendar/block', {
            method: 'POST',
            body: JSON.stringify({ from, to, reason }),
        });
    },

    unblockDate: async (blockId) => {
        return spRequest(`/calendar/block/${blockId}`, {
            method: 'DELETE',
        });
    },
};

export default {
    public: spPublicApi,
    farmer: spFarmerBookingApi,
    provider: spProviderApi,
    tokenStore: spTokenStore,
};
