/**
 * apiClient.js
 *
 * Centralised HTTP client for the Farm360 backend services.
 * Handles:
 *   • Attaching the JWT access token to every request.
 *   • Automatically refreshing the access token on 401 and retrying once.
 *   • Clearing tokens and redirecting to login on refresh failure.
 *
 * Usage:
 *   import api from './apiClient';
 *   const data = await api.post('/auth/login', { email, password });
 */

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4000';

// ── Token storage ─────────────────────────────────────────────────────────────
// NOTE: For production, move the refresh token to an httpOnly cookie to prevent
// XSS access. For now both tokens live in localStorage for simplicity.

const TOKEN_KEY = 'farm360_access_token';
const REFRESH_KEY = 'farm360_refresh_token';

export const tokenStore = {
    getAccess: () => localStorage.getItem(TOKEN_KEY),
    setAccess: (t) => localStorage.setItem(TOKEN_KEY, t),
    getRefresh: () => localStorage.getItem(REFRESH_KEY),
    setRefresh: (t) => localStorage.setItem(REFRESH_KEY, t),
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
    },
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────

let isRefreshing = false;

/**
 * Make an authenticated request to the auth service.
 *
 * @param {string} path    - e.g. '/auth/login'
 * @param {object} options - standard fetch options (method, body, headers, …)
 * @param {boolean} _retry - internal flag to prevent infinite refresh loops
 */
const request = async (path, options = {}, _retry = false) => {
    const url = `${AUTH_SERVICE_URL}${path}`;
    const accessToken = tokenStore.getAccess();

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const res = await fetch(url, { ...options, headers });

    // ── Auto-refresh on 401 ──────────────────────────────────────────────────
    if (res.status === 401 && !_retry && !isRefreshing) {
        const refreshToken = tokenStore.getRefresh();

        if (!refreshToken) {
            tokenStore.clear();
            window.dispatchEvent(new Event('auth:logout'));
            throw new Error('Session expired. Please log in again.');
        }

        isRefreshing = true;
        try {
            const refreshRes = await fetch(`${AUTH_SERVICE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!refreshRes.ok) {
                tokenStore.clear();
                window.dispatchEvent(new Event('auth:logout'));
                throw new Error('Session expired. Please log in again.');
            }

            const { accessToken: newToken } = await refreshRes.json();
            tokenStore.setAccess(newToken);

            // Retry the original request with the new token
            return request(path, options, true);
        } finally {
            isRefreshing = false;
        }
    }

    // ── Parse response ───────────────────────────────────────────────────────
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : null;

    if (!res.ok) {
        const message = data?.error || `Request failed with status ${res.status}`;
        throw new Error(message);
    }

    return data;
};

// ── Public API ────────────────────────────────────────────────────────────────

const api = {
    get: (path, options = {}) =>
        request(path, { ...options, method: 'GET' }),

    post: (path, body, options = {}) =>
        request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),

    put: (path, body, options = {}) =>
        request(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),

    delete: (path, options = {}) =>
        request(path, { ...options, method: 'DELETE' }),
};

export default api;
