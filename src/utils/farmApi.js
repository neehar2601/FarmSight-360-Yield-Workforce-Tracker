/**
 * farmApi.js
 *
 * Thin client for the Farm Microservice (port 4001).
 * All requests include the stored JWT from tokenStore.
 * Returns { data, error } — never throws.
 */

import { tokenStore } from './apiClient';

const FARM_SERVICE_URL = 'http://localhost:4001';

const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenStore.getAccess()}`,
});

const call = async (method, path, body) => {
    try {
        const res = await fetch(`${FARM_SERVICE_URL}${path}`, {
            method,
            headers: headers(),
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { data: null, error: data.error || `Error ${res.status}` };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err.message || 'Network error' };
    }
};

// ── Farms ─────────────────────────────────────────────────────────────────────
export const getFarms = () => call('GET', '/farm/farms');
export const createFarm = (body) => call('POST', '/farm/farms', body);
export const updateFarm = (id, body) => call('PUT', `/farm/farms/${id}`, body);
export const deleteFarm = (id) => call('DELETE', `/farm/farms/${id}`);

// ── Crops ─────────────────────────────────────────────────────────────────────
export const getCrops = (farmId) => call('GET', `/farm/crops?farm_id=${farmId}`);
export const createCrop = (body) => call('POST', '/farm/crops', body);
export const updateCrop = (id, body) => call('PUT', `/farm/crops/${id}`, body);
export const getCropById = (id, farmId) => call('GET', `/farm/crops/${id}?farm_id=${farmId}`);
export const harvestCrop = (id, body) => call('POST', `/farm/crops/${id}/harvest`, body);
export const sellCrop = (id, body) => call('POST', `/farm/crops/${id}/sell`, body);
export const segregateCrop = (id, body) => call('POST', `/farm/crops/${id}/segregate`, body);
export const getCropHistory = (id, farmId) => call('GET', `/farm/crops/${id}/history?farm_id=${farmId}`);

// ── Inventory ─────────────────────────────────────────────────────────────────
export const getInventoryCategories = (farmId) =>
    call('GET', `/farm/inventory/categories?farm_id=${farmId}`);
export const createInventoryCategory = (body) =>
    call('POST', '/farm/inventory/categories', body);
export const getInventoryItems = (farmId) =>
    call('GET', `/farm/inventory?farm_id=${farmId}`);
export const createInventoryItem = (body) => call('POST', '/farm/inventory', body);
export const getInventoryItemById = (id, farmId) =>
    call('GET', `/farm/inventory/${id}?farm_id=${farmId}`);
export const updateInventoryItem = (id, body) => call('PUT', `/farm/inventory/${id}`, body);
export const buyInventoryItem = (id, body) => call('POST', `/farm/inventory/${id}/buy`, body);
export const sellInventoryItem = (id, body) => call('POST', `/farm/inventory/${id}/sell`, body);

// ── Finance ───────────────────────────────────────────────────────────────────
export const getFinanceSummary = (farmId, from, to) => {
    const params = new URLSearchParams({ farm_id: farmId });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return call('GET', `/farm/finance/summary?${params}`);
};
export const getFinanceTransactions = (farmId, from, to) => {
    const params = new URLSearchParams({ farm_id: farmId });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return call('GET', `/farm/finance/transactions?${params}`);
};
