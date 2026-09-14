import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getInventoryCategories, createInventoryCategory,
    getInventoryItems, createInventoryItem,
    updateInventoryItem, buyInventoryItem, sellInventoryItem,
    useInventoryItem, getActiveCrops, getInventoryItemById,
} from '../../utils/farmApi';

// ── Activity Types (shared with Worker attendance) ────────────────────────────
const ACTIVITY_TYPES = [
    { value: 'GENERAL',       label: 'General',       emoji: '👷' },
    { value: 'PLUCKING',      label: 'Plucking',      emoji: '🌿' },
    { value: 'FERTILISATION', label: 'Fertilisation', emoji: '🌱' },
    { value: 'SPRAY',         label: 'Spraying',      emoji: '💦' },
    { value: 'MULCHING',      label: 'Mulching',      emoji: '🍂' },
    { value: 'PRUNING',       label: 'Pruning',       emoji: '✂️' },
    { value: 'SORTING',       label: 'Sorting',       emoji: '📦' },
    { value: 'IRRIGATION',    label: 'Irrigation',    emoji: '💧' },
];

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
    </div>
);

// ── Activity emoji map (shared across modals) ─────────────────────────────────
const ACTIVITY_EMOJI = {
    GENERAL: '👷', PLUCKING: '🌿', FERTILISATION: '🌱',
    SPRAY: '💦', MULCHING: '🍂', PRUNING: '✂️',
    SORTING: '📦', IRRIGATION: '💧',
};

// ── Modal: Item Detail / Usage Tracker ────────────────────────────────────────
const ItemDetailModal = ({ itemId, farmId, onClose, onAction }) => {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('usage'); // 'usage' | 'purchases' | 'sales' | 'all'

    const load = useCallback(async () => {
        setLoading(true);
        const { data } = await getInventoryItemById(itemId, farmId);
        setLoading(false);
        if (data) setItem(data);
    }, [itemId, farmId]);

    useEffect(() => { load(); }, [load]);

    if (!item && loading) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-10"><Spinner /></div>
        </div>
    );
    if (!item) return null;

    const s = item.stock_summary || {};
    const totalBought = parseFloat(s.total_bought || 0);
    const totalUsed   = parseFloat(s.total_used   || 0);
    const totalSold   = parseFloat(s.total_sold   || 0);
    const totalOut    = totalUsed + totalSold;
    const inStock     = parseFloat(item.current_quantity);
    const totalSpent  = parseFloat(s.total_spent  || 0);
    const avgCost     = totalBought > 0 ? totalSpent / totalBought : 0;

    // usage % of total bought
    const usedPct  = totalBought > 0 ? Math.round((totalUsed / totalBought) * 100) : 0;
    const soldPct  = totalBought > 0 ? Math.round((totalSold / totalBought) * 100) : 0;
    const stockPct = totalBought > 0 ? Math.max(0, 100 - usedPct - soldPct) : 100;

    const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const fmtQty = (n) => parseFloat(n || 0).toFixed(2);

    const TX_FILTERS = { usage: 'use', purchases: 'buy', sales: 'sell', all: null };
    const txFilter = TX_FILTERS[tab];
    const visibleTx = txFilter
        ? item.transactions.filter(t => t.type === txFilter)
        : item.transactions;

    const txConfig = {
        buy:  { label: 'Purchased',  color: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200',  emoji: '🛒', sign: '+' },
        use:  { label: 'Used',       color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', emoji: '🪣', sign: '-' },
        sell: { label: 'Sold',       color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', emoji: '💸', sign: '-' },
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{item.category_name}</p>
                        <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {item.unit} · Avg cost ₹{fmt(avgCost)} per {item.unit}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`text-3xl font-extrabold ${inStock <= 5 ? 'text-orange-500' : 'text-gray-800'}`}>
                            {fmtQty(inStock)}
                        </p>
                        <p className="text-xs text-gray-400">{item.unit} in stock</p>
                    </div>
                </div>

                {/* Stock flow summary */}
                <div className="px-6 pt-5">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-blue-500 font-medium">Total Bought</p>
                            <p className="text-lg font-bold text-blue-800 mt-0.5">{fmtQty(totalBought)} {item.unit}</p>
                            <p className="text-[10px] text-blue-400">₹{fmt(totalSpent)} spent</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-amber-600 font-medium">Total Used</p>
                            <p className="text-lg font-bold text-amber-800 mt-0.5">{fmtQty(totalUsed)} {item.unit}</p>
                            <p className="text-[10px] text-amber-400">{usedPct}% of purchased</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-green-600 font-medium">Total Sold</p>
                            <p className="text-lg font-bold text-green-800 mt-0.5">{fmtQty(totalSold)} {item.unit}</p>
                            <p className="text-[10px] text-green-400">{soldPct}% of purchased</p>
                        </div>
                    </div>

                    {/* Visual stock flow bar */}
                    {totalBought > 0 && (
                        <div className="mb-4">
                            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                                <div className="bg-amber-400 h-full transition-all" style={{ width: `${usedPct}%` }} title={`Used: ${usedPct}%`} />
                                <div className="bg-green-400 h-full transition-all" style={{ width: `${soldPct}%` }} title={`Sold: ${soldPct}%`} />
                                <div className="bg-gray-300 h-full transition-all" style={{ width: `${stockPct}%` }} title={`In stock: ${stockPct}%`} />
                            </div>
                            <div className="flex gap-4 mt-1.5 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>Used {usedPct}%</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>Sold {soldPct}%</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block"></span>In stock {stockPct}%</span>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-1 border-b">
                        {[['usage', '🪣 Usage'], ['purchases', '🛒 Purchases'], ['sales', '💸 Sales'], ['all', '📋 All']].map(([key, label]) => (
                            <button key={key} onClick={() => setTab(key)}
                                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
                                    tab === key
                                        ? 'border-green-600 text-green-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                                {label}
                                <span className="ml-1 text-[10px] text-gray-400">
                                    ({item.transactions.filter(t => !TX_FILTERS[key] || t.type === TX_FILTERS[key]).length})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transaction list */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
                    {visibleTx.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <p className="text-4xl mb-2">{tab === 'usage' ? '🪣' : tab === 'purchases' ? '🛒' : '📋'}</p>
                            <p className="text-sm">No {tab === 'all' ? 'transactions' : tab} recorded yet</p>
                        </div>
                    ) : visibleTx.map(tx => {
                        const cfg = txConfig[tx.type] || txConfig.buy;
                        const actEmoji = ACTIVITY_EMOJI[tx.activity_type] || '';
                        const cropLabel = tx.crop_name
                            ? `${tx.crop_name}${tx.crop_variety ? ` (${tx.crop_variety})` : ''}`
                            : null;
                        return (
                            <div key={tx.id} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                                <span className="text-lg mt-0.5">{cfg.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                                        {tx.activity_type && (
                                            <span className="text-[10px] bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                                                {actEmoji} {tx.activity_type.charAt(0) + tx.activity_type.slice(1).toLowerCase()}
                                            </span>
                                        )}
                                        {cropLabel && (
                                            <span className="text-[10px] bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                                                🌾 {cropLabel}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                    {tx.notes && <p className="text-xs text-gray-500 mt-0.5 italic truncate">{tx.notes}</p>}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-sm font-bold ${cfg.color}`}>
                                        {cfg.sign}{fmtQty(tx.quantity)} {item.unit}
                                    </p>
                                    {tx.total_amount > 0 && (
                                        <p className="text-[10px] text-gray-400">₹{fmt(tx.total_amount)}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer actions */}
                <div className="p-4 border-t flex gap-2 justify-between">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Close</button>
                    <div className="flex gap-2">
                        <button onClick={() => { onClose(); onAction('buy', item); }}
                            className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">🛒 Buy</button>
                        <button onClick={() => { onClose(); onAction('use', item); }}
                            className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100">🪣 Use</button>
                        <button onClick={() => { onClose(); onAction('sell', item); }}
                            className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">💸 Sell</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Modal: Add Inventory Item ──────────────────────────────────────────────────
const AddItemModal = ({ farmId, categories, onClose, onSaved }) => {
    const [form, setForm] = useState({ name: '', category_id: '', unit: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const { data, error: err } = await createInventoryItem({ ...form, farm_id: farmId });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📦 Add Inventory Item</h2>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g. DAP Fertiliser, Urea, Neem Oil" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} required
                            className="w-full border border-gray-300 rounded-lg p-2.5">
                            <option value="">Select category</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}{c.is_default ? '' : ' (custom)'}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                        <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} required
                            className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="kg, bags, liters, units…" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Optional" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50">
                            {saving ? 'Adding…' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: Buy / Sell Stock ────────────────────────────────────────────────────
const TransactionModal = ({ item, type, onClose, onSaved }) => {
    const { currentFarm } = useAuth();
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        quantity: '', unit_price: '', transaction_date: today,
        notes: '', activity_type: '', crop_id: '',
    });
    const [crops, setCrops] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Fetch active crops for the crop dropdown (buy only)
    useEffect(() => {
        if (type === 'buy' && currentFarm?.id) {
            getActiveCrops(currentFarm.id).then(({ data }) => {
                setCrops((data || []));
            });
        }
    }, [type, currentFarm?.id]);

    const total = form.quantity && form.unit_price
        ? (parseFloat(form.quantity) * parseFloat(form.unit_price)).toLocaleString('en-IN')
        : '—';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const fn = type === 'buy' ? buyInventoryItem : sellInventoryItem;
        const payload = { ...form, farm_id: item.farm_id };
        // Only include activity fields for buy
        if (type !== 'buy') {
            delete payload.activity_type;
            delete payload.crop_id;
        }
        const { data, error: err } = await fn(item.id, payload);
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved(data);
        onClose();
    };

    const isBuy = type === 'buy';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    {isBuy ? '🛒 Buy Stock' : '💸 Sell Stock'}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    {item.name} · Stock: <strong className="text-gray-700">{item.current_quantity} {item.unit}</strong>
                </p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity ({item.unit}) *</label>
                            <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price per {item.unit} (₹) *</label>
                            <input type="number" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input type="date" value={form.transaction_date} onChange={e => setForm(p => ({ ...p, transaction_date: e.target.value }))} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Supplier, buyer, etc." />
                        </div>
                    </div>

                    {/* Activity + Crop tagging — BUY only */}
                    {isBuy && (
                        <div className="border-t border-gray-100 pt-4 space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tag this purchase (optional)</p>

                            {/* Activity selector */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">📌 Activity</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {ACTIVITY_TYPES.map(act => (
                                        <button
                                            key={act.value}
                                            type="button"
                                            onClick={() => setForm(p => ({
                                                ...p,
                                                activity_type: p.activity_type === act.value ? '' : act.value
                                            }))}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                                form.activity_type === act.value
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700'
                                            }`}>
                                            {act.emoji} {act.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Crop dropdown */}
                            {crops.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">🌾 Intended Crop</label>
                                    <select
                                        value={form.crop_id}
                                        onChange={e => setForm(p => ({ ...p, crop_id: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                                        <option value="">No specific crop</option>
                                        {crops.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}{c.variety ? ` (${c.variety})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`rounded-lg p-3 border ${isBuy ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <p className={`text-sm font-semibold ${isBuy ? 'text-red-800' : 'text-green-800'}`}>
                            {isBuy ? 'Total Expense' : 'Total Income'}: ₹{total}
                        </p>
                        <p className={`text-xs mt-0.5 ${isBuy ? 'text-red-600' : 'text-green-600'}`}>
                            {isBuy
                                ? `Recorded as an expense${form.activity_type ? ` under ${form.activity_type.charAt(0) + form.activity_type.slice(1).toLowerCase()}` : ''} in Finance`
                                : 'Recorded as income in Finance'}
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={saving}
                            className={`px-5 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${
                                isBuy ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'
                            }`}>
                            {saving ? 'Saving…' : isBuy ? 'Confirm Purchase' : 'Confirm Sale'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: Use / Consume Stock ────────────────────────────────────────────────
// Records on-farm consumption — no financial impact, stock quantity decreases.
const UseStockModal = ({ item, onClose, onSaved }) => {
    const { currentFarm } = useAuth();
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        quantity: '', transaction_date: today,
        notes: '', activity_type: '', crop_id: '',
    });
    const [crops, setCrops] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentFarm?.id) {
            getActiveCrops(currentFarm.id).then(({ data }) => {
                setCrops((data || []));
            });
        }
    }, [currentFarm?.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (parseFloat(form.quantity) > parseFloat(item.current_quantity)) {
            setError(`Only ${item.current_quantity} ${item.unit} available in stock`);
            return;
        }
        setSaving(true);
        const { data, error: err } = await useInventoryItem(item.id, { ...form, farm_id: item.farm_id });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">🪣 Use / Consume Stock</h2>
                <p className="text-sm text-gray-500 mb-1">
                    {item.name} · Available: <strong className="text-gray-700">{item.current_quantity} {item.unit}</strong>
                </p>
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mb-5">
                    ⚠️ Stock will decrease. No income recorded — expense was captured at purchase.
                </p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qty Used ({item.unit}) *</label>
                            <input
                                type="number" min="0.01" step="0.01"
                                max={item.current_quantity}
                                value={form.quantity}
                                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                                required
                                className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input type="date" value={form.transaction_date}
                                onChange={e => setForm(p => ({ ...p, transaction_date: e.target.value }))}
                                required className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <input value={form.notes}
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg p-2.5"
                                placeholder="e.g. Applied to North Block" />
                        </div>
                    </div>

                    {/* Activity + Crop tagging */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tag this usage (optional)</p>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">📌 Activity</label>
                            <div className="flex flex-wrap gap-1.5">
                                {ACTIVITY_TYPES.map(act => (
                                    <button
                                        key={act.value}
                                        type="button"
                                        onClick={() => setForm(p => ({
                                            ...p,
                                            activity_type: p.activity_type === act.value ? '' : act.value
                                        }))}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                            form.activity_type === act.value
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-700'
                                        }`}>
                                        {act.emoji} {act.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {crops.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">🌾 Applied to Crop</label>
                                <select
                                    value={form.crop_id}
                                    onChange={e => setForm(p => ({ ...p, crop_id: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                                    <option value="">No specific crop</option>
                                    {crops.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}{c.variety ? ` (${c.variety})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50">
                            {saving ? 'Recording…' : '🪣 Record Usage'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: Add Custom Category ─────────────────────────────────────────────────
const CategoryModal = ({ farmId, onClose, onSaved }) => {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        const { data } = await createInventoryCategory({ farm_id: farmId, name: name.trim() });
        setSaving(false);
        if (data) onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Add Custom Category</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input value={name} onChange={e => setName(e.target.value)} required
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500"
                        placeholder="e.g. Organic Inputs, Crop Insurance" />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                            {saving ? 'Saving…' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main InventoryPage ─────────────────────────────────────────────────────────
export default function InventoryPage() {
    const { currentFarm } = useAuth();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null); // null | 'add' | 'category' | { type:'buy'|'sell', item }
    const [selectedCategory, setSelectedCategory] = useState('all');

    const load = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        const [itemsRes, catRes] = await Promise.all([
            getInventoryItems(currentFarm.id),
            getInventoryCategories(currentFarm.id),
        ]);
        setLoading(false);
        if (itemsRes.error) { setError(itemsRes.error); return; }
        setItems(itemsRes.data || []);
        setCategories(catRes.data || []);
    }, [currentFarm?.id]);

    useEffect(() => { load(); }, [load]);

    const filtered = selectedCategory === 'all'
        ? items
        : items.filter(i => i.category_id === selectedCategory);

    if (!currentFarm) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Select a farm to view inventory.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Inventory</h1>
                    <p className="text-gray-500 mt-1">{currentFarm.name} — seeds, fertilisers, tools & more</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setModal('category')}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium">
                        + Category
                    </button>
                    <button onClick={() => setModal('add')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-lg transition-all">
                        <span className="text-lg">+</span> Add Item
                    </button>
                </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
                <button onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
                    All
                </button>
                {categories.map(c => (
                    <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === c.id ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
                        {c.name}
                    </button>
                ))}
            </div>

            {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">{error}</div>}

            {loading ? <Spinner /> : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-16 text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-500 text-lg">No items yet. Add your first inventory item!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(item => {
                        const isLow = item.current_quantity <= 5;
                        return (
                            <div key={item.id} className={`bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 ${isLow ? 'border-l-4 border-orange-400' : ''}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">{item.category_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-2xl font-bold ${isLow ? 'text-orange-500' : 'text-gray-800'}`}>
                                            {parseFloat(item.current_quantity).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-400">{item.unit}</p>
                                    </div>
                                </div>
                                {isLow && (
                                    <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg mb-3">
                                        ⚠️ Low stock
                                    </p>
                                )}
                                {item.notes && <p className="text-xs text-gray-400 italic mb-3">{item.notes}</p>}
                                {/* History shortcut — click item name area */}
                                <button
                                    onClick={() => setModal({ type: 'history', itemId: item.id })}
                                    className="w-full text-left text-[10px] text-gray-400 hover:text-green-600 transition-colors mb-3 flex items-center gap-1">
                                    <span>📋</span> View full history & usage tracker
                                </button>
                                <div className="flex gap-2 pt-3 border-t">
                                    <button onClick={() => setModal({ type: 'buy', item })}
                                        className="flex-1 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-all">
                                        🛒 Buy
                                    </button>
                                    <button onClick={() => setModal({ type: 'use', item })}
                                        className="flex-1 py-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition-all">
                                        🪣 Use
                                    </button>
                                    <button onClick={() => setModal({ type: 'sell', item })}
                                        className="flex-1 py-1.5 text-xs font-medium bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-all">
                                        💸 Sell
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {modal === 'add' && (
                <AddItemModal farmId={currentFarm.id} categories={categories} onClose={() => setModal(null)} onSaved={load} />
            )}
            {modal === 'category' && (
                <CategoryModal farmId={currentFarm.id} onClose={() => setModal(null)} onSaved={load} />
            )}
            {modal?.type === 'history' && (
                <ItemDetailModal
                    itemId={modal.itemId}
                    farmId={currentFarm.id}
                    onClose={() => setModal(null)}
                    onAction={(type, item) => setModal({ type, item })}
                />
            )}
            {modal?.type === 'use' && (
                <UseStockModal item={modal.item} onClose={() => setModal(null)} onSaved={load} />
            )}
            {(modal?.type === 'buy' || modal?.type === 'sell') && (
                <TransactionModal item={modal.item} type={modal.type} onClose={() => setModal(null)} onSaved={load} />
            )}
        </div>
    );
}
