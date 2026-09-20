import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getInventoryCategories, createInventoryCategory,
    getInventoryItems, createInventoryItem,
    updateInventoryItem, buyInventoryItem, sellInventoryItem,
    useInventoryItem, getActiveCrops, getInventoryItemById,
    tagInventoryTransaction, getInventoryUsages,
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

// ── Modal: Tag Inventory Transaction to Crop / Activity ─────────────────────
const TagCropModal = ({ tx, item, farmId, crops = [], onClose, onSaved }) => {
    const [cropsList, setCropsList] = useState(crops);
    const [cropId, setCropId] = useState(tx.crop_id || '');
    const [activityType, setActivityType] = useState(tx.activity_type || 'FERTILISATION');
    const [notes, setNotes] = useState(tx.notes || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (crops && crops.length > 0) {
            setCropsList(crops);
        } else if (farmId) {
            getActiveCrops(farmId).then(({ data }) => setCropsList(data || []));
        }
    }, [crops, farmId]);

    const itemName = tx.item_name || item?.name || 'Inventory Item';
    const itemUnit = tx.item_unit || item?.unit || '';
    const dateFormatted = tx.transaction_date
        ? new Date(tx.transaction_date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        })
        : '—';

    const currentCropName = tx.crop_name || cropsList.find(c => c.id === tx.crop_id)?.name;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const { data, error: err } = await tagInventoryTransaction(tx.id, {
            farm_id: farmId,
            crop_id: cropId || null,
            activity_type: activityType || null,
            notes: notes || null,
        });
        setSaving(false);
        if (err) {
            setError(err);
            return;
        }
        if (onSaved) onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-150">
                {/* Header */}
                <div className="flex items-start justify-between border-b pb-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span>🏷️</span> Tag to Crop & Activity
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {itemName} · <strong>{parseFloat(tx.quantity).toFixed(2)} {itemUnit}</strong> on {dateFormatted}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
                </div>

                {/* Current Tag Status Notice */}
                <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="text-gray-500">Current Status:</span>
                    {currentCropName ? (
                        <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>🌾</span> Tagged to {currentCropName}
                        </span>
                    ) : (
                        <span className="font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>⚠️</span> Untagged (Missed Crop)
                        </span>
                    )}
                </div>

                {error && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Crop selection */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                            🌾 Applied to Crop
                        </label>
                        <select
                            value={cropId}
                            onChange={e => setCropId(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                            <option value="">No specific crop (untagged)</option>
                            {cropsList.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}{c.variety ? ` (${c.variety})` : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Links this utilisation to crop yield analytics and Finance cost breakdowns.
                        </p>
                    </div>

                    {/* Activity Type */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                            📌 Activity / Task
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {ACTIVITY_TYPES.map(act => (
                                <button
                                    key={act.value}
                                    type="button"
                                    onClick={() => setActivityType(act.value)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                        activityType === act.value
                                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700'
                                    }`}>
                                    {act.emoji} {act.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                            📝 Notes (optional)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Applied 2 bags after morning weeding"
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50">
                            {saving ? 'Saving…' : '✓ Save Tag'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: Item Detail / Usage Tracker ────────────────────────────────────────
const ItemDetailModal = ({ itemId, farmId, crops = [], onClose, onAction, onUpdated }) => {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('usage'); // 'usage' | 'purchases' | 'sales' | 'all'
    const [taggingTx, setTaggingTx] = useState(null);
    const [cropsList, setCropsList] = useState(crops);

    useEffect(() => {
        if (crops && crops.length > 0) {
            setCropsList(crops);
        } else if (farmId) {
            getActiveCrops(farmId).then(({ data }) => setCropsList(data || []));
        }
    }, [crops, farmId]);

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
                        const canTag = tx.type === 'use' || tx.type === 'buy';
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
                                        {cropLabel ? (
                                            <span className="text-[10px] bg-white border border-emerald-300 text-emerald-800 rounded-full px-2.5 py-0.5 font-semibold flex items-center gap-1">
                                                🌾 {cropLabel}
                                                {canTag && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setTaggingTx(tx)}
                                                        title="Change crop tag"
                                                        className="hover:text-emerald-950 font-bold ml-0.5">
                                                        ✏️
                                                    </button>
                                                )}
                                            </span>
                                        ) : canTag ? (
                                            <button
                                                type="button"
                                                onClick={() => setTaggingTx(tx)}
                                                className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-full px-2.5 py-0.5 font-bold transition-all flex items-center gap-1 shadow-sm">
                                                <span>🏷️</span> Tag Crop
                                            </button>
                                        ) : null}
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
                                    {canTag && (
                                        <button
                                            type="button"
                                            onClick={() => setTaggingTx(tx)}
                                            className="text-[10px] text-gray-400 hover:text-green-700 font-semibold block mt-1 ml-auto">
                                            {tx.crop_id ? '✏️ Edit Tag' : '🏷️ Tag to Crop'}
                                        </button>
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

                {/* Tag Crop Modal when triggered from transaction row */}
                {taggingTx && (
                    <TagCropModal
                        tx={taggingTx}
                        item={item}
                        farmId={farmId}
                        crops={cropsList}
                        onClose={() => setTaggingTx(null)}
                        onSaved={(updatedTx) => {
                            setItem(prev => ({
                                ...prev,
                                transactions: prev.transactions.map(t => t.id === updatedTx.id ? { ...t, ...updatedTx } : t),
                            }));
                            setTaggingTx(null);
                            if (onUpdated) onUpdated();
                        }}
                    />
                )}
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

// ── Component: Usage Tracker & Crop Tagging Section ──────────────────────────
const UsageTrackerSection = ({
    usages,
    crops,
    loading,
    onTagClick,
    onUseClick,
}) => {
    const [filter, setFilter] = useState('all'); // 'all' | 'untagged' | cropId
    const [searchTerm, setSearchTerm] = useState('');

    const untaggedCount = usages.filter(u => !u.crop_id).length;
    const taggedCount = usages.length - untaggedCount;

    const filtered = usages.filter(u => {
        if (filter === 'untagged' && u.crop_id) return false;
        if (filter !== 'all' && filter !== 'untagged' && u.crop_id !== filter) return false;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchesItem = (u.item_name || '').toLowerCase().includes(term);
            const matchesNotes = (u.notes || '').toLowerCase().includes(term);
            const matchesCrop = (u.crop_name || '').toLowerCase().includes(term);
            const matchesCat = (u.category_name || '').toLowerCase().includes(term);
            if (!matchesItem && !matchesNotes && !matchesCrop && !matchesCat) return false;
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Untagged Alert Banner */}
            {untaggedCount > 0 && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-r-2xl flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <h4 className="text-sm font-bold text-amber-900">
                                {untaggedCount} {untaggedCount === 1 ? 'Usage' : 'Usages'} Not Tagged to Any Crop
                            </h4>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Missed tagging when applying fertiliser or pesticides? Click <strong>“🏷️ Tag to Crop”</strong> below to link them now so your crop costs and reports remain accurate.
                            </p>
                        </div>
                    </div>
                    {filter !== 'untagged' && (
                        <button
                            onClick={() => setFilter('untagged')}
                            className="shrink-0 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all">
                            View Untagged Only
                        </button>
                    )}
                </div>
            )}

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Usages Recorded</p>
                        <p className="text-2xl font-bold text-gray-800 mt-0.5">{usages.length}</p>
                    </div>
                    <span className="text-3xl p-2.5 bg-amber-50 rounded-2xl">🪣</span>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tagged to Crops</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-0.5">{taggedCount}</p>
                    </div>
                    <span className="text-3xl p-2.5 bg-emerald-50 rounded-2xl">🌾</span>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Missing Crop Tag</p>
                        <p className={`text-2xl font-bold mt-0.5 ${untaggedCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {untaggedCount}
                        </p>
                    </div>
                    <span className="text-3xl p-2.5 bg-orange-50 rounded-2xl">🏷️</span>
                </div>
            </div>

            {/* Filter toolbar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            filter === 'all'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        All Usages ({usages.length})
                    </button>
                    <button
                        onClick={() => setFilter('untagged')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            filter === 'untagged'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        }`}>
                        <span>⚠️ Untagged Only</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            filter === 'untagged' ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-900 font-bold'
                        }`}>
                            {untaggedCount}
                        </span>
                    </button>
                    {crops.length > 0 && (
                        <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 flex-wrap">
                            <span className="text-xs text-gray-400 font-medium">Crop:</span>
                            {crops.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setFilter(c.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                        filter === c.id
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                    }`}>
                                    🌾 {c.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Search item, crop, notes…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Usages Table */}
            {loading ? (
                <Spinner />
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="text-5xl mb-3">🪣</div>
                    <h3 className="text-base font-bold text-gray-700">No usage records found</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        {filter === 'untagged'
                            ? 'Great job! All your used inventory is currently tagged to crops.'
                            : 'When you consume items (like applying fertilizer or pesticides), they will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4">Item & Category</th>
                                    <th className="py-3.5 px-4">Quantity Used</th>
                                    <th className="py-3.5 px-4">Activity</th>
                                    <th className="py-3.5 px-4">Tagged Crop</th>
                                    <th className="py-3.5 px-4">Notes</th>
                                    <th className="py-3.5 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                {filtered.map(u => {
                                    const dateFormatted = u.transaction_date
                                        ? new Date(u.transaction_date).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })
                                        : '—';
                                    const actEmoji = ACTIVITY_EMOJI[u.activity_type] || '🌱';
                                    const cropText = u.crop_name
                                        ? `${u.crop_name}${u.crop_variety ? ` (${u.crop_variety})` : ''}`
                                        : null;

                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                                            {/* Date */}
                                            <td className="py-3 px-4 font-medium text-gray-600 whitespace-nowrap">
                                                {dateFormatted}
                                            </td>

                                            {/* Item & Category */}
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-gray-800">{u.item_name}</div>
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                                                    {u.category_name}
                                                </span>
                                            </td>

                                            {/* Quantity Used */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <span className="font-extrabold text-amber-700">
                                                    -{parseFloat(u.quantity).toFixed(2)}
                                                </span>{' '}
                                                <span className="text-gray-500">{u.item_unit}</span>
                                            </td>

                                            {/* Activity */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {u.activity_type ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                                        <span>{actEmoji}</span>
                                                        <span>{u.activity_type.charAt(0) + u.activity_type.slice(1).toLowerCase()}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>

                                            {/* Tagged Crop */}
                                            <td className="py-3 px-4">
                                                {cropText ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full shadow-sm">
                                                        <span>🌾</span>
                                                        <span>{cropText}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full animate-pulse">
                                                        <span>⚠️</span>
                                                        <span>Untagged</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Notes */}
                                            <td className="py-3 px-4 max-w-xs truncate text-gray-500 italic">
                                                {u.notes || '—'}
                                            </td>

                                            {/* Action */}
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                {cropText ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onTagClick(u)}
                                                        className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 border border-emerald-300 hover:border-emerald-400 rounded-xl text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-1">
                                                        <span>✏️</span> Change Tag
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => onTagClick(u)}
                                                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-1.5">
                                                        <span>🏷️</span> Tag to Crop
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main InventoryPage ─────────────────────────────────────────────────────────
export default function InventoryPage() {
    const { currentFarm } = useAuth();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [crops, setCrops] = useState([]);
    const [usages, setUsages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('stock'); // 'stock' | 'usages'
    const [modal, setModal] = useState(null); // null | 'add' | 'category' | { type:'buy'|'sell'|'use'|'history', item }
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [taggingTx, setTaggingTx] = useState(null); // transaction being tagged from UsageTracker

    const load = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        const [itemsRes, catRes, cropsRes, usagesRes] = await Promise.all([
            getInventoryItems(currentFarm.id),
            getInventoryCategories(currentFarm.id),
            getActiveCrops(currentFarm.id),
            getInventoryUsages(currentFarm.id),
        ]);
        setLoading(false);
        if (itemsRes.error) { setError(itemsRes.error); return; }
        setItems(itemsRes.data || []);
        setCategories(catRes.data || []);
        setCrops(cropsRes.data || []);
        setUsages(usagesRes.data || []);
    }, [currentFarm?.id]);

    useEffect(() => { load(); }, [load]);

    const isCropCareCategory = (catName = '') => {
        const c = (catName || '').toLowerCase();
        return c.includes('fertil') || c.includes('pestic') || c.includes('insectic') ||
               c.includes('herbic') || c.includes('weed') || c.includes('fungic') ||
               c.includes('spray') || c.includes('regulat') || c.includes('tonic');
    };

    const generalCategories = categories.filter(c => !isCropCareCategory(c.name));
    const generalItems = items.filter(i => !isCropCareCategory(i.category_name));
    const generalUsages = usages.filter(u => !isCropCareCategory(u.category_name));
    const untaggedUsagesCount = generalUsages.filter(u => !u.crop_id).length;

    const filtered = selectedCategory === 'all'
        ? generalItems
        : generalItems.filter(i => i.category_id === selectedCategory);

    if (!currentFarm) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Select a farm to view inventory.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Inventory</h1>
                    <p className="text-gray-500 mt-1">{currentFarm.name} — stock, supplies & equipment</p>
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

            {/* Banner redirecting to Fertilisers & Sprays */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🌱</span>
                    <div>
                        <p className="text-xs font-bold text-emerald-900">Looking for Fertilisers, Pesticides or Sprays?</p>
                        <p className="text-[11px] text-emerald-700">All soil nutrients, chemicals, and spray logs have been moved to the dedicated Fertilisers & Sprays tab.</p>
                    </div>
                </div>
                <a
                    href="/farm/crop-care"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1">
                    Open Fertilisers & Sprays &rarr;
                </a>
            </div>

            {/* View Mode Switcher: Stock vs Usage Tracker & Tagging */}
            <div className="flex items-center gap-3 border-b pb-3">
                <button
                    onClick={() => setViewMode('stock')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                        viewMode === 'stock'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}>
                    <span>📦 Stock Overview</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        viewMode === 'stock' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {generalItems.length}
                    </span>
                </button>

                <button
                    onClick={() => setViewMode('usages')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                        viewMode === 'usages'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}>
                    <span>🪣 Usage Tracker & Tagging</span>
                    {untaggedUsagesCount > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                            viewMode === 'usages'
                                ? 'bg-amber-400 text-amber-950'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                            <span>⚠️</span> {untaggedUsagesCount} untagged
                        </span>
                    ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            viewMode === 'usages' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                            {generalUsages.length}
                        </span>
                    )}
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">{error}</div>}

            {/* View Mode: Usage Tracker */}
            {viewMode === 'usages' ? (
                <UsageTrackerSection
                    usages={generalUsages}
                    crops={crops}
                    loading={loading}
                    onTagClick={(u) => setTaggingTx(u)}
                />
            ) : (
                /* View Mode: Stock Overview */
                <>
                    {/* Category filter */}
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
                            All
                        </button>
                        {generalCategories.map(c => (
                            <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === c.id ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}>
                                {c.name}
                            </button>
                        ))}
                    </div>

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
                </>
            )}

            {modal === 'add' && (
                <AddItemModal farmId={currentFarm.id} categories={generalCategories} onClose={() => setModal(null)} onSaved={load} />
            )}
            {modal === 'category' && (
                <CategoryModal farmId={currentFarm.id} onClose={() => setModal(null)} onSaved={load} />
            )}
            {modal?.type === 'history' && (
                <ItemDetailModal
                    itemId={modal.itemId}
                    farmId={currentFarm.id}
                    crops={crops}
                    onClose={() => setModal(null)}
                    onAction={(type, item) => setModal({ type, item })}
                    onUpdated={load}
                />
            )}
            {modal?.type === 'use' && (
                <UseStockModal item={modal.item} onClose={() => setModal(null)} onSaved={load} />
            )}
            {(modal?.type === 'buy' || modal?.type === 'sell') && (
                <TransactionModal item={modal.item} type={modal.type} onClose={() => setModal(null)} onSaved={load} />
            )}

            {/* Direct Tag Crop Modal from Usage Tracker table */}
            {taggingTx && (
                <TagCropModal
                    tx={taggingTx}
                    farmId={currentFarm.id}
                    crops={crops}
                    onClose={() => setTaggingTx(null)}
                    onSaved={(updatedTx) => {
                        setUsages(prev => prev.map(u => u.id === updatedTx.id ? { ...u, ...updatedTx } : u));
                        setTaggingTx(null);
                        load();
                    }}
                />
            )}
        </div>
    );
}
