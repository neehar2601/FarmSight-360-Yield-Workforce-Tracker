import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getInventoryItems,
    getInventoryUsages,
    getInventoryCategories,
    getActiveCrops,
    getInventoryItemById,
    getInventoryActivityBreakdown,
    createInventoryItem,
    updateInventoryItem,
    buyInventoryItem,
    useInventoryItem,
    createInventoryCategory,
} from '../../utils/farmApi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
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

const STANDARD_CATEGORIES = [
    { name: 'Fertiliser',              group: 'FERTILISER', emoji: '🌱' },
    { name: 'Pesticides',              group: 'PESTICIDE',  emoji: '🐛' },
    { name: 'Herbicides',              group: 'HERBICIDE',  emoji: '🌿' },
    { name: 'Fungicides',              group: 'FUNGICIDE',  emoji: '🍄' },
    { name: 'Bio-stimulants & Sprays', group: 'SPRAY',      emoji: '💦' },
];

const COMMON_UNITS = ['kg', 'litres', 'bags', 'grams', 'ml', 'packets', 'bottles'];

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

// ── Modal: Add New Crop Care Input ──────────────────────────────────────────
const AddInputModal = ({ farmId, existingCategories, onClose, onSaved }) => {
    const [name, setName] = useState('');
    const [selectedCategoryName, setSelectedCategoryName] = useState('Fertiliser');
    const [unit, setUnit] = useState('kg');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError('');

        try {
            // Check if category exists or needs creation
            let cat = existingCategories.find(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase());
            let categoryId = cat?.id;

            if (!categoryId) {
                const { data: newCat, error: catErr } = await createInventoryCategory({
                    farm_id: farmId,
                    name: selectedCategoryName,
                });
                if (catErr) {
                    setError(catErr);
                    setSaving(false);
                    return;
                }
                categoryId = newCat.id;
            }

            const { data, error: itemErr } = await createInventoryItem({
                farm_id: farmId,
                category_id: categoryId,
                name: name.trim(),
                unit,
                notes: notes.trim() || null,
            });

            setSaving(false);
            if (itemErr) {
                setError(itemErr);
                return;
            }

            onSaved(data);
            onClose();
        } catch (err) {
            setSaving(false);
            setError(err.message || 'Failed to add item');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-100">
                <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-700 pb-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span>🌱</span> Add Fertiliser / Spray Input
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Register a nutrient, chemical, or spray product in your farm catalog</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
                </div>

                {error && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Input / Product Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Urea 46%, Mancozeb 75 WP, Neem Oil 10000 PPM"
                            required
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                                Category *
                            </label>
                            <select
                                value={selectedCategoryName}
                                onChange={e => setSelectedCategoryName(e.target.value)}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                                {STANDARD_CATEGORIES.map(c => (
                                    <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                                Measurement Unit *
                            </label>
                            <select
                                value={unit}
                                onChange={e => setUnit(e.target.value)}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                                {COMMON_UNITS.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Notes & Recommended Dosage (Optional)
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Recommended dosage: 2 ml/litre water. Used for foliar spray."
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50">
                            {saving ? 'Saving…' : '✓ Save Input'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: Buy / Restock Input ──────────────────────────────────────────────
const BuyInputModal = ({ item, farmId, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [transactionDate, setTransactionDate] = useState(today);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const totalAmount = quantity && unitPrice
        ? (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2)
        : '0.00';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!quantity || !unitPrice) return;
        setSaving(true);
        setError('');

        const { data, error: err } = await buyInventoryItem(item.id, {
            farm_id: farmId,
            quantity: parseFloat(quantity),
            unit_price: parseFloat(unitPrice),
            total_amount: parseFloat(totalAmount),
            transaction_date: transactionDate,
            notes: notes.trim() || null,
        });

        setSaving(false);
        if (err) {
            setError(err);
            return;
        }

        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-100">
                <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-700 pb-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span>🛒</span> Buy / Restock Input
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {item.name} · Current Stock: <strong className="text-gray-700 dark:text-slate-200">{fmtQty(item.current_quantity)} {item.unit}</strong>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300">
                    💡 This purchase will increment available stock and automatically record an expense under Farm Finance.
                </div>

                {error && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                                Quantity Bought ({item.unit}) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                placeholder="0.00"
                                required
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                                Price per {item.unit} (₹) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={unitPrice}
                                onChange={e => setUnitPrice(e.target.value)}
                                placeholder="₹ 0.00"
                                required
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl flex items-center justify-between border border-gray-200 dark:border-slate-600">
                        <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Total Purchase Amount:</span>
                        <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-400">₹{fmt(totalAmount)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                                Purchase Date *
                            </label>
                            <input
                                type="date"
                                value={transactionDate}
                                onChange={e => setTransactionDate(e.target.value)}
                                required
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                                Supplier / Vendor
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="e.g. Kisan Agro Center"
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50">
                            {saving ? 'Processing…' : '✓ Record Purchase'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ── Modal: Use / Apply Input to Field ────────────────────────────────────────
const UseInputModal = ({ item, farmId, crops = [], onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const defaultActivity = item.groupKey === 'FERTILISER' ? 'FERTILISATION' : 'SPRAY';

    const [quantity, setQuantity] = useState('');
    const [transactionDate, setTransactionDate] = useState(today);
    const [cropId, setCropId] = useState('');
    const [activityType, setActivityType] = useState(defaultActivity);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const maxQty = parseFloat(item.current_quantity || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const q = parseFloat(quantity);
        if (!q || q <= 0) return;
        if (q > maxQty) {
            setError(`Cannot apply more than available stock (${maxQty} ${item.unit})`);
            return;
        }

        setSaving(true);
        setError('');

        const { data, error: err } = await useInventoryItem(item.id, {
            farm_id: farmId,
            quantity: q,
            transaction_date: transactionDate,
            crop_id: cropId || null,
            activity_type: activityType,
            notes: notes.trim() || null,
        });

        setSaving(false);
        if (err) {
            setError(err);
            return;
        }

        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-100">
                <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-700 pb-3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span>🪣</span> Apply to Crop / Field
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {item.name} · Available Stock: <strong className="text-emerald-700 dark:text-emerald-400">{fmtQty(maxQty)} {item.unit}</strong>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                    ⚠️ Decrements available inventory and links consumption cost to the selected crop under Finance.
                </div>

                {error && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                                Qty Applied ({item.unit}) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={maxQty}
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                placeholder="0.00"
                                required
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                                Application Date *
                            </label>
                            <input
                                type="date"
                                value={transactionDate}
                                onChange={e => setTransactionDate(e.target.value)}
                                required
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            🌾 Target Crop
                        </label>
                        <select
                            value={cropId}
                            onChange={e => setCropId(e.target.value)}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none">
                            <option value="">General Farm (No specific crop)</option>
                            {crops.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}{c.variety ? ` (${c.variety})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            📌 Task Type
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setActivityType('FERTILISATION')}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    activityType === 'FERTILISATION'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                        : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                                }`}>
                                🌱 Fertilisation
                            </button>
                            <button
                                type="button"
                                onClick={() => setActivityType('SPRAY')}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    activityType === 'SPRAY'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                                }`}>
                                💦 Spraying
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Dosage / Remarks (Optional)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Applied 2 bags after morning weeding"
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50">
                            {saving ? 'Recording…' : '✓ Record Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: Edit Input Details ───────────────────────────────────────────────
const EditInputModal = ({ item, farmId, onClose, onSaved }) => {
    const [name, setName] = useState(item.name || '');
    const [unit, setUnit] = useState(item.unit || 'kg');
    const [notes, setNotes] = useState(item.notes || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError('');

        const { data, error: err } = await updateInventoryItem(item.id, {
            farm_id: farmId,
            name: name.trim(),
            unit,
            notes: notes.trim() || null,
        });

        setSaving(false);
        if (err) {
            setError(err);
            return;
        }

        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-100">
                <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-700 pb-3">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span>✏️</span> Edit Product Details
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
                </div>

                {error && (
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Product Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Measurement Unit *
                        </label>
                        <select
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                            {COMMON_UNITS.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Notes / Instructions
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50">
                            {saving ? 'Updating…' : '✓ Update Details'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: Item History (Read-Only) ───────────────────────────────────────────
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
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 shadow-2xl border border-gray-100 dark:border-slate-700"><Spinner /></div>
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
            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150 text-gray-800 dark:text-slate-100">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-start justify-between bg-emerald-50/50 dark:bg-emerald-950/30">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🌱</span>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{item.name}</h3>
                        </div>
                        <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold mt-1">
                            {item.category_name} · Unit: {item.unit}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-2xl leading-none">&times;</button>
                </div>

                {/* Stock Summary Cards */}
                <div className="grid grid-cols-3 gap-3 p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 p-3 sm:p-3.5 rounded-xl text-center">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase">Available Stock</p>
                        <p className={`text-lg sm:text-xl font-bold mt-1 ${parseFloat(item.current_quantity) <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            {fmtQty(item.current_quantity)} {item.unit}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 p-3 sm:p-3.5 rounded-xl text-center">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase">Total Used</p>
                        <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mt-1">
                            {fmtQty(totalUsed)} {item.unit}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 p-3 sm:p-3.5 rounded-xl text-center">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase">Avg Purchase Rate</p>
                        <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mt-1">
                            ₹{fmt(avgCost)} / {item.unit}
                        </p>
                    </div>
                </div>

                {/* Usage Application History Table */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <span>📋</span> Field Application Log ({usages.length})
                    </h4>
                    {usages.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-slate-400 italic text-center py-8">No usage records logged for this input yet.</p>
                    ) : (
                        <div className="border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300 font-semibold border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="p-2.5">Date</th>
                                        <th className="p-2.5">Applied Qty</th>
                                        <th className="p-2.5">Target Crop</th>
                                        <th className="p-2.5">Task</th>
                                        <th className="p-2.5">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
                                    {usages.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-700/40">
                                            <td className="p-2.5 text-gray-600 dark:text-slate-300 font-medium">
                                                {new Date(u.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-2.5 font-bold text-gray-800 dark:text-white">
                                                {fmtQty(u.quantity)} {item.unit}
                                            </td>
                                            <td className="p-2.5">
                                                {u.crop_name ? (
                                                    <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                                                        🌾 {u.crop_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-slate-400 italic">General Farm</span>
                                                )}
                                            </td>
                                            <td className="p-2.5 text-gray-600 dark:text-slate-300">
                                                {u.activity_type === 'FERTILISATION' ? '🌱 Fertilisation' : u.activity_type === 'SPRAY' ? '💦 Spraying' : (u.activity_type || '—')}
                                            </td>
                                            <td className="p-2.5 text-gray-500 dark:text-slate-400 italic max-w-[150px] truncate">{u.notes || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex justify-end bg-gray-50 dark:bg-slate-800/80">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-800 dark:bg-slate-700 hover:bg-gray-900 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all">
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
    const [categories, setCategories] = useState([]);
    const [usages, setUsages] = useState([]);
    const [crops, setCrops] = useState([]);
    const [activityBreakdown, setActivityBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter & view state
    const [selectedGroup, setSelectedGroup] = useState('ALL');
    const [viewMode, setViewMode] = useState('stock'); // stock | usages | trends
    const [selectedCropFilter, setSelectedCropFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state: null | 'add' | { type: 'buy'|'use'|'edit'|'history', item }
    const [modal, setModal] = useState(null);

    const loadData = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        setError('');

        const [itemsRes, usagesRes, cropsRes, actRes, catsRes] = await Promise.all([
            getInventoryItems(currentFarm.id),
            getInventoryUsages(currentFarm.id),
            getActiveCrops(currentFarm.id),
            getInventoryActivityBreakdown(currentFarm.id),
            getInventoryCategories(currentFarm.id),
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
        setCategories(catsRes.data || []);
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
        <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700/80">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl sm:text-3xl">🌱</span>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-white">Fertilisers &amp; Sprays</h1>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {currentFarm.name} · Soil nutrients, chemicals, fungicides, crop sprays, and field applications
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-2.5">
                    <button
                        onClick={loadData}
                        className="px-3.5 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/60 text-xs font-semibold flex items-center gap-1.5 transition-all">
                        <span>🔄</span> Refresh
                    </button>
                    <button
                        id="demo-cropcare-add-btn"
                        onClick={() => setModal('add')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all">
                        <span className="text-sm font-extrabold">+</span> Add Input
                    </button>
                </div>
            </div>

            {/* Error notice */}
            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={loadData} className="underline font-bold">Retry</button>
                </div>
            )}

            {/* Top Metric Cards - 2 cols on mobile, 4 on desktop */}
            <div id="demo-cropcare-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-gray-100 dark:border-slate-700/80 flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                        🧪
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-400 font-semibold uppercase truncate">Active Inputs</p>
                        <p className="text-lg sm:text-2xl font-extrabold text-gray-800 dark:text-white mt-0.5">{totalActiveInputs}</p>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-400 truncate">Nutrients &amp; chemicals</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-gray-100 dark:border-slate-700/80 flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 ${lowStockCount > 0 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : 'bg-green-50 dark:bg-emerald-950/60 text-green-600 dark:text-emerald-400'}`}>
                        {lowStockCount > 0 ? '⚠️' : '✅'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-400 font-semibold uppercase truncate">Stock Health</p>
                        <p className={`text-lg sm:text-2xl font-extrabold mt-0.5 truncate ${lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-700 dark:text-emerald-400'}`}>
                            {lowStockCount > 0 ? `${lowStockCount} Low` : 'All Healthy'}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-400 truncate">{lowStockCount > 0 ? 'Items below 5 units' : 'Sufficient quantities'}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-gray-100 dark:border-slate-700/80 flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                        📋
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-400 font-semibold uppercase truncate">Applications</p>
                        <p className="text-lg sm:text-2xl font-extrabold text-gray-800 dark:text-white mt-0.5">{totalApplicationsCount}</p>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-400 truncate">Field spray &amp; fertiliser</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xs border border-gray-100 dark:border-slate-700/80 flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl sm:text-2xl shrink-0">
                        💰
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-400 font-semibold uppercase truncate">Material Value</p>
                        <p className="text-lg sm:text-2xl font-extrabold text-gray-800 dark:text-white mt-0.5">₹{fmt(totalAttributedCost)}</p>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-400 truncate">Total applied value</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area with Side Category Tab Bar */}
            <div id="demo-resources-table" className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
                {/* ── SIDE TAB / BAR FOR DISPLAY OF DATA ────────────────── */}
                {/* On desktop: sticky vertical sidebar; on mobile/tablet: horizontal scrollable pills, never sticky */}
                <div id="demo-cropcare-sidebar" className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700/80 p-3 sm:p-4 space-y-2 lg:sticky lg:top-4">
                    <div className="px-1 lg:px-3 pt-1 pb-1 flex items-center justify-between lg:block">
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Input Categories</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-400 hidden lg:block mt-0.5">Filter by input classification</p>
                    </div>

                    <div className="flex lg:flex-col overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pb-1 lg:pb-0 items-center lg:items-stretch">
                        {CATEGORY_GROUPS.map(g => {
                            const isSelected = selectedGroup === g.key;
                            const count = groupCounts[g.key] || 0;
                            return (
                                <button
                                    key={g.key}
                                    onClick={() => setSelectedGroup(g.key)}
                                    className={`flex-shrink-0 lg:w-full text-left px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 whitespace-nowrap ${
                                        isSelected
                                            ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/30'
                                            : 'bg-gray-50/70 dark:bg-slate-700/40 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200/50 dark:border-slate-600/30 font-medium'
                                    }`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-base sm:text-lg shrink-0">{g.emoji}</span>
                                        <span className="text-xs truncate">{g.label}</span>
                                    </div>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                                        isSelected ? 'bg-emerald-700 text-white' : 'bg-gray-200/80 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="hidden lg:block pt-3 border-t border-gray-100 dark:border-slate-700/80 px-2">
                        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">💡 Unified Farm Ledger</p>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                                Purchasing or consuming inputs here updates available stock and reflects in Finance automatically.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── MAIN DISPLAY AREA ────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-4">
                    {/* View Mode Bar + Search Toolbar */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700/80 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* View Switcher */}
                        <div className="flex items-center bg-gray-100 dark:bg-slate-900/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setViewMode('stock')}
                                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                                    viewMode === 'stock'
                                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 font-medium'
                                }`}>
                                <span>📦 Stock Status</span>
                                <span className="text-[10px] bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full font-semibold">
                                    {filteredItems.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setViewMode('usages')}
                                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                                    viewMode === 'usages'
                                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 font-medium'
                                }`}>
                                <span>🌾 Application Log</span>
                                <span className="text-[10px] bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full font-semibold">
                                    {filteredUsages.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setViewMode('trends')}
                                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                                    viewMode === 'trends'
                                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 font-medium'
                                }`}>
                                <span>📊 Trends</span>
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-56">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search chemical, crop..."
                                    className="w-full bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-xs">
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
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700/80 p-12 text-center">
                                    <p className="text-5xl mb-3">🧪</p>
                                    <p className="text-gray-600 dark:text-slate-300 font-bold text-base">No inputs found in this category</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                                        Click below to add your first fertiliser, pesticide, herbicide or spray input.
                                    </p>
                                    <button
                                        onClick={() => setModal('add')}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all">
                                        + Add Fertiliser / Spray
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredItems.map((item, idx) => {
                                        const isLow = parseFloat(item.current_quantity) <= 5;
                                        const isFirst = idx === 0;
                                        const group = CATEGORY_GROUPS.find(g => g.key === item.groupKey) || {};
                                        return (
                                            <div
                                                key={item.id}
                                                id={isFirst ? "demo-cropcare-card-primary" : undefined}
                                                className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xs hover:shadow-md transition-all p-4 sm:p-5 border flex flex-col justify-between ${
                                                    isLow ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/20' : 'border-gray-100 dark:border-slate-700/80'
                                                }`}>
                                                <div>
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1">
                                                                <span>{group.emoji || '🌱'}</span> {item.category_name}
                                                            </span>
                                                            <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 mt-1.5">{item.name}</h3>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-2xl font-extrabold ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-gray-800 dark:text-slate-100'}`}>
                                                                {fmtQty(item.current_quantity)}
                                                            </p>
                                                            <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">{item.unit}</p>
                                                        </div>
                                                    </div>

                                                    {isLow && (
                                                        <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[11px] font-bold flex items-center gap-1.5">
                                                            <span>⚠️</span> Low Stock Notice — Reorder Recommended
                                                        </div>
                                                    )}

                                                    {item.notes && (
                                                        <p className="text-xs text-gray-500 dark:text-slate-300 italic mb-3 line-clamp-2 bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700/50 p-2 rounded-xl">
                                                            {item.notes}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="pt-3 border-t border-gray-100 dark:border-slate-700/80 flex items-center gap-2">
                                                    <button
                                                        id={isFirst ? "demo-cropcare-buy-btn" : undefined}
                                                        onClick={() => setModal({ type: 'buy', item })}
                                                        className="flex-1 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800/60 transition-all flex items-center justify-center gap-1">
                                                        <span>🛒</span> Buy
                                                    </button>
                                                    <button
                                                        id={isFirst ? "demo-cropcare-use-btn" : undefined}
                                                        onClick={() => setModal({ type: 'use', item })}
                                                        className="flex-1 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800/60 transition-all flex items-center justify-center gap-1">
                                                        <span>🪣</span> Use
                                                    </button>
                                                    <button
                                                        onClick={() => setModal({ type: 'edit', item })}
                                                        className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                                                        title="Edit Details">
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => setModal({ type: 'history', item })}
                                                        className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                                                        title="View History">
                                                        📋
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
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700/80 p-4 sm:p-5 space-y-4">
                            {/* Filter Bar */}
                            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100 dark:border-slate-700/80">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100">Field Application &amp; Spray History</h3>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">Chronological record of stock applied to crops</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Filter Crop:</label>
                                    <select
                                        value={selectedCropFilter}
                                        onChange={e => setSelectedCropFilter(e.target.value)}
                                        className="border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
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
                                <div className="text-center py-12 text-gray-400 dark:text-slate-400">
                                    <p className="text-3xl mb-1.5">🌾</p>
                                    <p className="text-sm font-semibold">No application records found</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">Applications recorded will show here.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-50 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300 font-semibold border-b border-gray-200 dark:border-slate-700">
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
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
                                            {filteredUsages.map(u => (
                                                <tr key={u.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-700/40 transition-colors">
                                                    <td className="p-3 text-gray-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                                        {new Date(u.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-3 font-bold text-gray-800 dark:text-slate-100">
                                                        {u.item_name}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                                            {u.category_name}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-extrabold text-emerald-800 dark:text-emerald-400 whitespace-nowrap">
                                                        {fmtQty(u.quantity)} {u.item_unit}
                                                    </td>
                                                    <td className="p-3">
                                                        {u.crop_name ? (
                                                            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                                                                🌾 {u.crop_name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full text-[11px]">
                                                                General Farm
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                                                        {u.activity_type === 'FERTILISATION' ? '🌱 Fertilisation' : u.activity_type === 'SPRAY' ? '💦 Spraying' : (u.activity_type || '—')}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-gray-800 dark:text-slate-100 whitespace-nowrap">
                                                        {u.attributed_cost ? `₹${fmt(u.attributed_cost)}` : '—'}
                                                    </td>
                                                    <td className="p-3 text-gray-500 dark:text-slate-400 italic max-w-[180px] truncate" title={u.notes || ''}>
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
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700/80 p-4 sm:p-6">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-1">Monthly Applied Value &amp; Consumption</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-400 mb-6">Attributed value of fertilisers and sprays consumed over time</p>
                                {chartDataByMonth.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 dark:text-slate-400">
                                        <p className="text-3xl mb-1.5">📊</p>
                                        <p className="text-xs">No consumption data recorded to render trends.</p>
                                    </div>
                                ) : (
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartDataByMonth}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => `₹${v}`} />
                                                <Tooltip
                                                    formatter={(val, name) => [name === 'cost' ? `₹${fmt(val)}` : val, name === 'cost' ? 'Attributed Spend' : 'Applications']}
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '12px' }}
                                                />
                                                <Bar dataKey="cost" fill="#059669" radius={[6, 6, 0, 0]} name="cost" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            {/* Crop Breakdown Grid */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-700/80 p-4 sm:p-6">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-1">Expenditure by Target Crop</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-400 mb-4">Rupee value of inputs consumed per crop</p>

                                {chartDataByCrop.length === 0 ? (
                                    <p className="text-xs text-gray-400 dark:text-slate-400 italic text-center py-6">No crop-tagged applications recorded yet.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {chartDataByCrop.map(c => (
                                            <div key={c.crop} className="border border-gray-100 dark:border-slate-700 rounded-xl p-4 bg-gray-50/50 dark:bg-slate-700/30">
                                                <p className="text-xs font-bold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
                                                    <span>🌾</span> {c.crop}
                                                </p>
                                                <p className="text-xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-2">
                                                    ₹{fmt(c.cost)}
                                                </p>
                                                <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5">
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


            {/* Modals */}
            {modal === 'add' && (
                <AddInputModal
                    farmId={currentFarm.id}
                    existingCategories={categories}
                    onClose={() => setModal(null)}
                    onSaved={loadData}
                />
            )}

            {modal?.type === 'buy' && (
                <BuyInputModal
                    item={modal.item}
                    farmId={currentFarm.id}
                    onClose={() => setModal(null)}
                    onSaved={loadData}
                />
            )}

            {modal?.type === 'use' && (
                <UseInputModal
                    item={modal.item}
                    farmId={currentFarm.id}
                    crops={crops}
                    onClose={() => setModal(null)}
                    onSaved={loadData}
                />
            )}

            {modal?.type === 'edit' && (
                <EditInputModal
                    item={modal.item}
                    farmId={currentFarm.id}
                    onClose={() => setModal(null)}
                    onSaved={loadData}
                />
            )}

            {modal?.type === 'history' && (
                <ItemDetailModal
                    itemId={modal.item.id}
                    farmId={currentFarm.id}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
