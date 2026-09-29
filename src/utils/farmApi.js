/**
 * farmApi.js — Prototype Mock Implementation
 * Directly connects to mockStore with zero backend dependency.
 */

import { mockStore } from '../mock/mockStore';

// ── Farms ─────────────────────────────────────────────────────────────────────
export const getFarms = async () => ({ data: mockStore.getFarms(), error: null });
export const getArchivedFarms = async () => ({ data: [], error: null });
export const createFarm = async (body) => mockStore.createFarm(body);
export const updateFarm = async (id, body) => {
    const farm = mockStore.getFarmById(id);
    if (farm) Object.assign(farm, body);
    mockStore.saveState();
    return { data: farm, error: null };
};
export const deleteFarm = async () => ({ data: { success: true }, error: null });
export const getArchivedFarmData = async () => ({ data: {}, error: null });

// ── Crops ─────────────────────────────────────────────────────────────────────
export const enrichCropData = (crop) => {
    const harvests = (mockStore.state.crop_harvests || []).filter(h => h.crop_id === crop.id);
    const segregations = (mockStore.state.crop_segregations || []).filter(s => s.crop_id === crop.id);
    const sales = (mockStore.state.crop_sales || []).filter(s => s.crop_id === crop.id);

    let total_harvested = 0;
    let total_sold = 0;
    const inventory = {};

    harvests.forEach(h => {
        const qty = Number(h.quantity || h.qty || 0);
        total_harvested += qty;
        const grade = h.grade || 'Unsegregated';
        inventory[grade] = (inventory[grade] || 0) + qty;
    });

    segregations.forEach(s => {
        const qty = Number(s.quantity || s.qty || 0);
        const src = s.source_grade || 'Unsegregated';
        const tgt = s.target_grade || 'Grade A';
        inventory[src] = (inventory[src] || 0) - qty;
        inventory[tgt] = (inventory[tgt] || 0) + qty;
    });

    sales.forEach(s => {
        const qty = Number(s.quantity || s.qty || 0);
        total_sold += qty;
        const grade = s.grade || 'Unsegregated';
        if (inventory[grade] !== undefined) {
            inventory[grade] = Math.max(0, inventory[grade] - qty);
        } else {
            // If sold unsegregated or generic
            const firstGrade = Object.keys(inventory)[0];
            if (firstGrade) {
                inventory[firstGrade] = Math.max(0, (inventory[firstGrade] || 0) - qty);
            }
        }
    });

    if (Object.keys(inventory).length === 0 && total_harvested > 0) {
        inventory['Unsegregated'] = Math.max(0, total_harvested - total_sold);
    }

    const available = Math.max(0, total_harvested - total_sold);

    return {
        ...crop,
        harvests,
        segregations,
        sales,
        total_harvested,
        total_sold,
        available,
        inventory,
        harvest_count: harvests.length,
    };
};

export const getCrops = async (farmId, archived = false) => {
    const crops = mockStore.getCrops(farmId, archived);
    const enriched = crops.map(enrichCropData);
    return { data: enriched, error: null };
};

export const createCrop = async (body) => mockStore.createCrop(body);
export const updateCrop = async (id, body) => mockStore.updateCrop(id, body);
export const patchCrop = async (id, farmId, patch) => mockStore.updateCrop(id, patch);
export const archiveCrop = async (id, farmId, is_archived) => mockStore.updateCrop(id, { is_archived });
export const getCropById = async (id) => {
    const crop = mockStore.state.crops.find(c => c.id === id);
    return { data: crop ? enrichCropData(crop) : null, error: null };
};
export const harvestCrop = async (id, body) => mockStore.harvestCrop(id, body);
export const sellCrop = async (id, body) => mockStore.sellCrop(id, body);
export const segregateCrop = async (id, body) => mockStore.segregateCrop(id, body);
export const getCropHistory = async (id) => {
    const harvests = mockStore.state.crop_harvests.filter(h => h.crop_id === id);
    const segregations = mockStore.state.crop_segregations.filter(s => s.crop_id === id);
    const sales = (mockStore.state.crop_sales || []).filter(s => s.crop_id === id);
    return { data: { harvests, segregations, sales }, error: null };
};

// ── Inventory ─────────────────────────────────────────────────────────────────
export const getInventoryCategories = async (farmId) => ({
    data: mockStore.getInventoryCategories(farmId),
    error: null,
});
export const createInventoryCategory = async (body) => mockStore.createInventoryCategory(body);

export const getInventoryItems = async (farmId) => ({
    data: mockStore.getInventoryItems(farmId),
    error: null,
});
export const createInventoryItem = async (body) => mockStore.createInventoryItem(body);
export const getInventoryItemById = async (id) => ({
    data: mockStore.state.inventory_items.find(i => i.id === id),
    error: null,
});
export const updateInventoryItem = async (id, body) => {
    const item = mockStore.state.inventory_items.find(i => i.id === id);
    if (item) Object.assign(item, body);
    mockStore.saveState();
    return { data: item, error: null };
};
export const buyInventoryItem = async (id, body) => {
    const item = mockStore.state.inventory_items.find(i => i.id === id);
    if (item) item.quantity += parseFloat(body.quantity || 0);
    mockStore.saveState();
    return { data: item, error: null };
};
export const sellInventoryItem = async (id, body) => {
    const item = mockStore.state.inventory_items.find(i => i.id === id);
    if (item) item.quantity = Math.max(0, item.quantity - parseFloat(body.quantity || 0));
    mockStore.saveState();
    return { data: item, error: null };
};
export const useInventoryItem = async (id, body) => {
    const item = mockStore.state.inventory_items.find(i => i.id === id);
    if (item) item.quantity = Math.max(0, item.quantity - parseFloat(body.quantity || 0));
    mockStore.saveState();
    return { data: item, error: null };
};
export const tagInventoryTransaction = async () => ({ data: { success: true }, error: null });
export const getInventoryUsages = async () => ({
    data: mockStore.state.inventory_transactions || [],
    error: null,
});

// ── Finance ───────────────────────────────────────────────────────────────────
export const getFinanceSummary = async () => ({
    data: mockStore.state.financials.summary,
    error: null,
});
export const getFinanceTransactions = async () => ({
    data: mockStore.state.financials.recentTransactions,
    error: null,
});
export const createFinanceTransaction = async (body) => {
    const tx = {
        id: `tx-${Date.now()}`,
        type: body.type || 'Revenue',
        description: body.description || 'Transaction',
        amount: parseFloat(body.amount || 0),
        category: body.category || 'General',
        date: body.date || new Date().toISOString().split('T')[0],
    };
    mockStore.state.financials.recentTransactions.unshift(tx);
    if (tx.type === 'Revenue') {
        mockStore.state.financials.summary.revenue += tx.amount;
    } else {
        mockStore.state.financials.summary.expenses += tx.amount;
    }
    mockStore.state.financials.summary.profit = mockStore.state.financials.summary.revenue - mockStore.state.financials.summary.expenses;
    mockStore.saveState();
    return { data: tx, error: null };
};
export const deleteFinanceTransaction = async (id) => {
    mockStore.state.financials.recentTransactions = mockStore.state.financials.recentTransactions.filter(t => t.id !== id);
    mockStore.saveState();
    return { data: { success: true }, error: null };
};

// ── Fertilisers & Crop Care ───────────────────────────────────────────────────
export const getCropCareItems = async (farmId) => {
    const items = mockStore.getInventoryItems(farmId).filter(i => {
        const c = (i.category_name || '').toLowerCase();
        return c.includes('fertil') || c.includes('spray') || c.includes('chem') || c.includes('bio');
    });
    return { data: items, error: null };
};

export const getInventoryActivityBreakdown = async () => ({
    data: [],
    error: null,
});

export const getActiveCrops = async (farmId) => getCrops(farmId, false);
