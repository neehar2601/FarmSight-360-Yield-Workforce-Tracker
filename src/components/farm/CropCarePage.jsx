import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getInventoryItems,
    getInventoryUsages,
    getInventoryCategories,
    getActiveCrops,
    getInventoryItemById,
    getInventoryActivityBreakdown,
} from '../../utils/farmApi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const fmtQty = (n) => parseFloat(n || 0).toFixed(2);

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600" />
    </div>
);

// ── Category Groups Definition ──────────────────────────────────────────────
const CATEGORY_GROUPS = [
    { key: 'ALL',        label: 'All Inputs & Sprays',   emoji: '🧪', desc: 'Consolidated overview of all chemical, spray & nutrient inputs' },
    { key: 'FERTILISER', label: 'Fertilisers',          emoji: '🌱', desc: 'Macronutrients (Urea, DAP, NPK), micronutrients, compost & bio-fertilisers' },
    { key: 'PESTICIDE',  label: 'Pesticides',           emoji: '🐛', desc: 'Insecticides, miticides & biological pest control sprays' },
    { key: 'HERBICIDE',  label: 'Herbicides',           emoji: '🌿', desc: 'Weedicides & weed management chemical sprays' },
    { key: 'FUNGICIDE',  label: 'Fungicides',           emoji: '🍄', desc: 'Bactericides, blight, rust & fungal preventive treatments' },
    { key: 'SPRAY',      label: 'Tonics & Other Sprays', emoji: '💦', desc: 'Plant growth regulators (PGR), foliar nutrition & stickers' },
];

const matchGroup = (categoryName = '', itemName = '', activityType = '') => {
    const c = (categoryName || '').toLowerCase();
    const i = (itemName || '').toLowerCase();
    const a = (activityType || '').toUpperCase();

    if (
        c.includes('fertil') || i.includes('fertil') ||
        i.includes('urea') || i.includes('dap') || i.includes('npk') ||
        i.includes('potash') || i.includes('manure') || i.includes('compost') ||
        a === 'FERTILISATION'
    ) {
        return 'FERTILISER';
    }
    if (
        c.includes('pestic') || c.includes('insectic') ||
        i.includes('pestic') || i.includes('insectic') ||
        i.includes('chlorpy') || i.includes('imidac')
    ) {
        return 'PESTICIDE';
    }
    if (
        c.includes('herbic') || c.includes('weed') ||
        i.includes('herbic') || i.includes('weed') ||
        i.includes('glyphos') || i.includes('2,4-d')
    ) {
        return 'HERBICIDE';
    }
    if (
        c.includes('fungic') || c.includes('bacteric') ||
        i.includes('fungic') || i.includes('mancozeb') || i.includes('copper')
    ) {
        return 'FUNGICIDE';
    }
    if (
        c.includes('spray') || c.includes('regulat') || c.includes('growth') ||
        c.includes('tonic') || c.includes('nutrient') || i.includes('spray') ||
        a === 'SPRAY'
    ) {
        return 'SPRAY';
    }
    return null;
};

// ── Item History Modal (Read-Only) ───────────────────────────────────────────
const ItemDetailModal = ({ itemId, farmId, onClose }) => {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!itemId || !farmId) return;
        setLoading(true);
        getInventoryItemById(itemId, farmId).then(({ data }) => {
            setLoading(false);
            if (data) setItem(data);
        });
    }, [itemId, farmId]);

    if (!item && loading) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-10 shadow-2xl"><Spinner /></div>
            </div>
        );
    }
    if (!item) return null;

    const s = item.stock_summary || {};
    const totalBought = parseFloat(s.total_bought || 0);
    const totalUsed = parseFloat(s.total_used || 0);
    const totalSpent = parseFloat(s.total_spent || 0);
    const avgCost = totalBought > 0 ? totalSpent / totalBought : 0;
    const usages = (item.transactions || []).filter(t => t.type === 'use');

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-emerald-50/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🌱</span>
                            <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                        </div>
                        <p className="text-xs text-emerald-800 font-semibold mt-1">
                            {item.category_name} · Unit: {item.unit}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>

                {/* Stock Summary Cards */}
                <div className="grid grid-cols-3 gap-3 p-6 border-b border-gray-100 bg-white">
                    <div className="bg-gray-50 p-3.5 rounded-xl text-center">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase">Available Stock</p>
                        <p className={`text-xl font-bold mt-1 ${parseFloat(item.current_quantity) <= 5 ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {fmtQty(item.current_quantity)} {item.unit}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-3.5 rounded-xl text-center">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase">Total Used</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">
                            {fmtQty(totalUsed)} {item.unit}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-3.5 rounded-xl text-center">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase">Avg Purchase Rate</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">
                            ₹{fmt(avgCost)} / {item.unit}
                        </p>
                    </div>
                </div>

                {/* Usage Application History Table */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span>📋</span> Field Application Log ({usages.length})
                    </h4>
                    {usages.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-8">No usage records logged for this input yet.</p>
                    ) : (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                                    <tr>
                                        <th className="p-2.5">Date</th>
                                        <th className="p-2.5">Applied Qty</th>
                                        <th className="p-2.5">Target Crop</th>
                                        <th className="p-2.5">Task</th>
                                        <th className="p-2.5">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {usages.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50/70">
                                            <td className="p-2.5 text-gray-600 font-medium">
                                                {new Date(u.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-2.5 font-bold text-gray-800">
                                                {fmtQty(u.quantity)} {item.unit}
                                            </td>
                                            <td className="p-2.5">
                                                {u.crop_name ? (
                                                    <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                                                        🌾 {u.crop_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">General Farm</span>
                                                )}
                                            </td>
                                            <td className="p-2.5 text-gray-600">
                                                {u.activity_type === 'FERTILISATION' ? '🌱 Fertilisation' : u.activity_type === 'SPRAY' ? '💦 Spraying' : (u.activity_type || '—')}
                                            </td>
                                            <td className="p-2.5 text-gray-500 italic max-w-[150px] truncate">{u.notes || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Page Component ──────────────────────────────────────────────────────
export default function CropCarePage() {
    const { currentFarm } = useAuth();

    // Data state
    const [items, setItems] = useState([]);
    const [usages, setUsages] = useState([]);
    const [crops, setCrops] = useState([]);
    const [activityBreakdown, setActivityBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter & view state
    const [selectedGroup, setSelectedGroup] = useState('ALL'); // ALL | FERTILISER | PESTICIDE | HERBICIDE | FUNGICIDE | SPRAY
    const [viewMode, setViewMode] = useState('stock'); // stock | usages | trends
    const [selectedCropFilter, setSelectedCropFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [detailItemId, setDetailItemId] = useState(null);

    const loadData = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        setError('');

        const [itemsRes, usagesRes, cropsRes, actRes] = await Promise.all([
            getInventoryItems(currentFarm.id),
            getInventoryUsages(currentFarm.id),
            getActiveCrops(currentFarm.id),
            getInventoryActivityBreakdown(currentFarm.id),
        ]);

        setLoading(false);
        if (itemsRes.error) {
            setError(itemsRes.error);
            return;
        }

        setItems(itemsRes.data || []);
        setUsages(usagesRes.data || []);
        setCrops(cropsRes.data || []);
        setActivityBreakdown(actRes.data || []);
    }, [currentFarm?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── Filter relevant crop care items ──────────────────────────────────────
    const classifiedItems = useMemo(() => {
        return items.map(item => ({
            ...item,
            groupKey: matchGroup(item.category_name, item.name) || 'OTHER',
        })).filter(item => {
            // Keep items that match one of our crop care groups
            return ['FERTILISER', 'PESTICIDE', 'HERBICIDE', 'FUNGICIDE', 'SPRAY'].includes(item.groupKey);
        });
    }, [items]);

    // Filtered items based on selected sidebar category tab
    const filteredItems = useMemo(() => {
        return classifiedItems.filter(item => {
            const matchesGroup = selectedGroup === 'ALL' || item.groupKey === selectedGroup;
            const matchesSearch = !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.category_name || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesGroup && matchesSearch;
        });
    }, [classifiedItems, selectedGroup, searchQuery]);

    // ── Filter relevant usage log entries ────────────────────────────────────
    const classifiedUsages = useMemo(() => {
        return usages.map(u => ({
            ...u,
            groupKey: matchGroup(u.category_name, u.item_name, u.activity_type) || 'OTHER',
        })).filter(u => {
            return ['FERTILISER', 'PESTICIDE', 'HERBICIDE', 'FUNGICIDE', 'SPRAY'].includes(u.groupKey);
        });
    }, [usages]);

    const filteredUsages = useMemo(() => {
        return classifiedUsages.filter(u => {
            const matchesGroup = selectedGroup === 'ALL' || u.groupKey === selectedGroup;
            const matchesCrop = selectedCropFilter === 'ALL' ||
                (selectedCropFilter === 'UNTAGGED' ? !u.crop_id : u.crop_id === selectedCropFilter);
            const matchesSearch = !searchQuery ||
                u.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.crop_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesGroup && matchesCrop && matchesSearch;
        });
    }, [classifiedUsages, selectedGroup, selectedCropFilter, searchQuery]);

    // ── Summary Metrics ──────────────────────────────────────────────────────
    const totalActiveInputs = classifiedItems.length;
    const lowStockCount = classifiedItems.filter(i => parseFloat(i.current_quantity) <= 5).length;
    const totalApplicationsCount = classifiedUsages.length;
    const totalAttributedCost = classifiedUsages.reduce((sum, u) => sum + parseFloat(u.attributed_cost || 0), 0);

    // Group Counts for side tabs
    const groupCounts = useMemo(() => {
        const counts = { ALL: classifiedItems.length, FERTILISER: 0, PESTICIDE: 0, HERBICIDE: 0, FUNGICIDE: 0, SPRAY: 0 };
        classifiedItems.forEach(i => {
            if (counts[i.groupKey] !== undefined) counts[i.groupKey]++;
        });
        return counts;
    }, [classifiedItems]);

    // ── Crop-Wise Aggregation for Trends & Charts ────────────────────────────
    const chartDataByCrop = useMemo(() => {
        const cropSpend = {};
        classifiedUsages.forEach(u => {
            const cName = u.crop_name || 'General Farm';
            if (!cropSpend[cName]) cropSpend[cName] = { crop: cName, cost: 0, count: 0 };
            cropSpend[cName].cost += parseFloat(u.attributed_cost || 0);
            cropSpend[cName].count += 1;
        });
        return Object.values(cropSpend).sort((a, b) => b.cost - a.cost);
    }, [classifiedUsages]);

    // Monthly Trends chart
    const chartDataByMonth = useMemo(() => {
        const monthMap = {};
        classifiedUsages.forEach(u => {
            if (!u.transaction_date) return;
            const d = new Date(u.transaction_date);
            const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
            if (!monthMap[key]) monthMap[key] = { month: key, cost: 0, applications: 0, rawDate: d };
            monthMap[key].cost += parseFloat(u.attributed_cost || 0);
            monthMap[key].applications += 1;
        });
        return Object.values(monthMap).sort((a, b) => a.rawDate - b.rawDate);
    }, [classifiedUsages]);

    if (!currentFarm) {
        return (
            <div className="flex items-center justify-center h-full py-24">
                <div className="text-center">
                    <p className="text-4xl mb-2">🌾</p>
                    <p className="text-gray-500 text-lg">Please select a farm to monitor fertilisers & sprays.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl">🌱</span>
                        <h1 className="text-2xl font-extrabold text-gray-800">Fertilisers & Sprays</h1>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {currentFarm.name} · Operational monitoring of soil nutrients, chemicals, fungicides, and crop sprays
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        className="px-3.5 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 transition-all">
                        <span>🔄</span> Refresh Data
                    </button>
                </div>
            </div>

            {/* Error notice */}
            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={loadData} className="underline font-bold">Retry</button>
                </div>
            )}

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
                        🧪
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase">Active Inputs</p>
                        <p className="text-2xl font-extrabold text-gray-800 mt-0.5">{totalActiveInputs}</p>
                        <p className="text-[11px] text-gray-400">Nutrients & chemicals</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                        {lowStockCount > 0 ? '⚠️' : '✅'}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase">Stock Health</p>
                        <p className={`text-2xl font-extrabold mt-0.5 ${lowStockCount > 0 ? 'text-amber-600' : 'text-green-700'}`}>
                            {lowStockCount > 0 ? `${lowStockCount} Low` : 'All Healthy'}
                        </p>
                        <p className="text-[11px] text-gray-400">{lowStockCount > 0 ? 'Items below 5 units' : 'Sufficient quantities'}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shrink-0">
                        📋
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase">Applications</p>
                        <p className="text-2xl font-extrabold text-gray-800 mt-0.5">{totalApplicationsCount}</p>
                        <p className="text-[11px] text-gray-400">Field spray/fertiliser logs</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl shrink-0">
                        💰
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase">Material Value</p>
                        <p className="text-2xl font-extrabold text-gray-800 mt-0.5">₹{fmt(totalAttributedCost)}</p>
                        <p className="text-[11px] text-gray-400">Total applied value</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area with Side Category Tab Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* ── SIDE TAB / BAR FOR DISPLAY OF DATA ────────────────── */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2 sticky top-4">
                    <div className="px-3 pt-2 pb-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Input Categories</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Filter by input classification</p>
                    </div>

                    <div className="space-y-1">
                        {CATEGORY_GROUPS.map(g => {
                            const isSelected = selectedGroup === g.key;
                            const count = groupCounts[g.key] || 0;
                            return (
                                <button
                                    key={g.key}
                                    onClick={() => setSelectedGroup(g.key)}
                                    className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between ${
                                        isSelected
                                            ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                                            : 'hover:bg-gray-50 text-gray-700 font-medium'
                                    }`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="text-lg shrink-0">{g.emoji}</span>
                                        <span className="text-xs truncate">{g.label}</span>
                                    </div>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                                        isSelected ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-3 border-t border-gray-100 px-3">
                        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                            <p className="text-[11px] font-bold text-emerald-800">💡 Read-Only Monitor</p>
                            <p className="text-[10px] text-emerald-700 mt-1 leading-relaxed">
                                On-farm usage is automatically tracked when marking worker attendance and recording stock consumption in Inventory.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── MAIN DISPLAY AREA ────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-4">
                    {/* View Mode Bar + Search Toolbar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between flex-wrap gap-3">
                        {/* View Switcher */}
                        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('stock')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    viewMode === 'stock' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}>
                                <span>📦 Stock Status</span>
                                <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded-full font-semibold">
                                    {filteredItems.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setViewMode('usages')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    viewMode === 'usages' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}>
                                <span>🌾 Application Log</span>
                                <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded-full font-semibold">
                                    {filteredUsages.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setViewMode('trends')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    viewMode === 'trends' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}>
                                <span>📊 Trends & Charts</span>
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search chemical, crop..."
                                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs w-48 sm:w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1.5 text-gray-400 hover:text-gray-600 text-xs">
                                        &times;
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* VIEW 1: Stock Status Catalog */}
                    {viewMode === 'stock' && (
                        <div>
                            {loading ? (
                                <Spinner />
                            ) : filteredItems.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                                    <p className="text-5xl mb-3">🧪</p>
                                    <p className="text-gray-600 font-bold text-base">No inputs found in this category</p>
                                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                        Items categorized as Fertilisers, Pesticides, Herbicides or Sprays in Inventory will appear here automatically.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredItems.map(item => {
                                        const isLow = parseFloat(item.current_quantity) <= 5;
                                        const group = CATEGORY_GROUPS.find(g => g.key === item.groupKey) || {};
                                        return (
                                            <div
                                                key={item.id}
                                                className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 border ${
                                                    isLow ? 'border-amber-300 bg-amber-50/20' : 'border-gray-100'
                                                }`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                                                            <span>{group.emoji || '🌱'}</span> {item.category_name}
                                                        </span>
                                                        <h3 className="text-base font-bold text-gray-800 mt-1.5">{item.name}</h3>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-2xl font-extrabold ${isLow ? 'text-amber-600' : 'text-gray-800'}`}>
                                                            {fmtQty(item.current_quantity)}
                                                        </p>
                                                        <p className="text-xs text-gray-400 font-medium">{item.unit}</p>
                                                    </div>
                                                </div>

                                                {isLow && (
                                                    <div className="mb-3 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1.5">
                                                        <span>⚠️</span> Low Stock Notice — Reorder Recommended
                                                    </div>
                                                )}

                                                {item.notes && (
                                                    <p className="text-xs text-gray-500 italic mb-3 line-clamp-2 bg-gray-50 p-2 rounded-lg">
                                                        {item.notes}
                                                    </p>
                                                )}

                                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                                    <span className="text-[11px] text-gray-400">
                                                        Updated {new Date(item.updated_at || item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <button
                                                        onClick={() => setDetailItemId(item.id)}
                                                        className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1">
                                                        <span>📋</span> View Application History &rarr;
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIEW 2: Operational Application & Spray Log */}
                    {viewMode === 'usages' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                            {/* Filter Bar */}
                            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800">Field Application & Spray History</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Chronological record of stock applied to crops</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-gray-500">Filter Crop:</label>
                                    <select
                                        value={selectedCropFilter}
                                        onChange={e => setSelectedCropFilter(e.target.value)}
                                        className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                        <option value="ALL">🌾 All Crops</option>
                                        {crops.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}{c.variety ? ` (${c.variety})` : ''}</option>
                                        ))}
                                        <option value="UNTAGGED">⚠️ Untagged / General Farm</option>
                                    </select>
                                </div>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <Spinner />
                            ) : filteredUsages.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-3xl mb-1.5">🌾</p>
                                    <p className="text-sm font-semibold">No application records found</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Applications recorded in Inventory or Attendance will show here.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                                            <tr>
                                                <th className="p-3">Date</th>
                                                <th className="p-3">Input Name</th>
                                                <th className="p-3">Category</th>
                                                <th className="p-3">Quantity Applied</th>
                                                <th className="p-3">Target Crop</th>
                                                <th className="p-3">Task</th>
                                                <th className="p-3 text-right">Attributed Value</th>
                                                <th className="p-3">Field Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredUsages.map(u => (
                                                <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="p-3 text-gray-600 font-medium whitespace-nowrap">
                                                        {new Date(u.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-3 font-bold text-gray-800">
                                                        {u.item_name}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                                            {u.category_name}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-extrabold text-emerald-800 whitespace-nowrap">
                                                        {fmtQty(u.quantity)} {u.item_unit}
                                                    </td>
                                                    <td className="p-3">
                                                        {u.crop_name ? (
                                                            <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                                🌾 {u.crop_name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
                                                                General Farm
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-gray-600 whitespace-nowrap">
                                                        {u.activity_type === 'FERTILISATION' ? '🌱 Fertilisation' : u.activity_type === 'SPRAY' ? '💦 Spraying' : (u.activity_type || '—')}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-gray-800 whitespace-nowrap">
                                                        {u.attributed_cost ? `₹${fmt(u.attributed_cost)}` : '—'}
                                                    </td>
                                                    <td className="p-3 text-gray-500 italic max-w-[180px] truncate" title={u.notes || ''}>
                                                        {u.notes || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VIEW 3: Trends & YoY Visuals */}
                    {viewMode === 'trends' && (
                        <div className="space-y-6">
                            {/* Monthly Expenditure & Applications Bar Chart */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-sm font-bold text-gray-800 mb-1">Monthly Applied Value & Consumption</h3>
                                <p className="text-xs text-gray-400 mb-6">Attributed value of fertilisers and sprays consumed over time</p>
                                {chartDataByMonth.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <p className="text-3xl mb-1.5">📊</p>
                                        <p className="text-xs">No consumption data recorded to render trends.</p>
                                    </div>
                                ) : (
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartDataByMonth}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                                                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={v => `₹${v}`} />
                                                <Tooltip
                                                    formatter={(val, name) => [name === 'cost' ? `₹${fmt(val)}` : val, name === 'cost' ? 'Attributed Spend' : 'Applications']}
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                                                />
                                                <Bar dataKey="cost" fill="#059669" radius={[6, 6, 0, 0]} name="cost" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            {/* Crop Breakdown Grid */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-sm font-bold text-gray-800 mb-1">Expenditure by Target Crop</h3>
                                <p className="text-xs text-gray-400 mb-4">Rupee value of inputs consumed per crop</p>

                                {chartDataByCrop.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic text-center py-6">No crop-tagged applications recorded yet.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {chartDataByCrop.map(c => (
                                            <div key={c.crop} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                                                <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                                    <span>🌾</span> {c.crop}
                                                </p>
                                                <p className="text-xl font-extrabold text-emerald-800 mt-2">
                                                    ₹{fmt(c.cost)}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    {c.count} application{c.count > 1 ? 's' : ''} logged
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Read-Only Item Detail Modal */}
            {detailItemId && (
                <ItemDetailModal
                    itemId={detailItemId}
                    farmId={currentFarm.id}
                    onClose={() => setDetailItemId(null)}
                />
            )}
        </div>
    );
}
