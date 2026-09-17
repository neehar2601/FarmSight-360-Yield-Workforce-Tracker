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
export const getArchivedFarms = () => call('GET', '/farm/farms/archived');
export const createFarm = (body) => call('POST', '/farm/farms', body);
export const updateFarm = (id, body) => call('PUT', `/farm/farms/${id}`, body);
/** action: 'archive' | 'merge', target_farm_id required for merge */
export const deleteFarm = (id, body) => call('DELETE', `/farm/farms/${id}`, body);
/** Fetch all crops, harvests, sales & inventory for any farm (incl. archived) */
export const getArchivedFarmData = (id) => call('GET', `/farm/farms/${id}/data`);

// ── Crops ─────────────────────────────────────────────────────────────────────
export const getCrops = (farmId, archived = false) =>
    call('GET', `/farm/crops?farm_id=${farmId}&archived=${archived}`);
export const createCrop = (body) => call('POST', '/farm/crops', body);
/** Full update — use patchCrop for partial changes like archiving */
export const updateCrop = (id, body) => call('PATCH', `/farm/crops/${id}`, body);
/** Lightweight partial update — only send changed fields */
export const patchCrop = (id, farmId, patch) => call('PATCH', `/farm/crops/${id}`, { farm_id: farmId, ...patch });
export const archiveCrop = (id, farmId, is_archived) => call('PATCH', `/farm/crops/${id}`, { farm_id: farmId, is_archived });
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
/** Record on-farm consumption (e.g. fertiliser applied). Reduces stock, no financial amount. */
export const useInventoryItem = (id, body) => call('POST', `/farm/inventory/${id}/use`, body);
/** Tag or update crop and activity on an existing inventory transaction */
export const tagInventoryTransaction = (txId, body) =>
    call('PATCH', `/farm/inventory/transactions/${txId}/tag`, body);
/** Get all inventory usage transactions for a farm (with optional untagged filter) */
export const getInventoryUsages = (farmId, options = {}) => {
    const params = new URLSearchParams({ farm_id: farmId });
    if (options.untagged_only) params.append('untagged_only', 'true');
    if (options.item_id) params.append('item_id', options.item_id);
    return call('GET', `/farm/inventory/usages?${params}`);
};

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
/** Per-activity material cost breakdown from inventory buy transactions */
export const getInventoryActivityBreakdown = (farmId, from, to) => {
    const params = new URLSearchParams({ farm_id: farmId });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return call('GET', `/farm/finance/inventory-activity-breakdown?${params}`);
};
/** Active (growing) crops for a farm — used to tag purchases to a specific crop */
export const getActiveCrops = (farmId) =>
    call('GET', `/farm/crops?farm_id=${farmId}&archived=false`);
