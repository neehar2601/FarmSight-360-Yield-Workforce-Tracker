import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getInventoryCategories, createInventoryCategory,
    getInventoryItems, createInventoryItem,
    updateInventoryItem, buyInventoryItem, sellInventoryItem,
    getActiveCrops,
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
                setCrops((data || []).filter(c => c.status === 'growing'));
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
                                <div className="flex gap-2 pt-3 border-t">
                                    <button onClick={() => setModal({ type: 'buy', item })}
                                        className="flex-1 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-all">
                                        🛒 Buy
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
            {modal?.type && (
                <TransactionModal item={modal.item} type={modal.type} onClose={() => setModal(null)} onSaved={load} />
            )}
        </div>
    );
}
