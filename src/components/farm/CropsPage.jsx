import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getCrops, createCrop, updateCrop,
    harvestCrop, sellCrop, segregateCrop, getCropHistory
} from '../../utils/farmApi';


const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
    </div>
);

// ── Modal: Plant a new crop ────────────────────────────────────────────────────
const PlantModal = ({ farmId, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        name: '', variety: '', area_planted: '', area_unit: 'acres',
        planting_date: today, expected_harvest_date: '', notes: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        const { data, error: err } = await createCrop({ ...form, farm_id: farmId });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🌱 Plant New Crop</h2>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name *</label>
                            <input name="name" value={form.name} onChange={handleChange} required
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="e.g. Maize, Wheat, Tomatoes" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                            <input name="variety" value={form.variety} onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Optional" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area Planted</label>
                            <div className="flex gap-2">
                                <input type="number" name="area_planted" value={form.area_planted} onChange={handleChange}
                                    className="flex-1 border border-gray-300 rounded-lg p-2.5" placeholder="0" />
                                <select name="area_unit" value={form.area_unit} onChange={handleChange}
                                    className="border border-gray-300 rounded-lg p-2.5">
                                    <option value="acres">acres</option>
                                    <option value="hectares">hectares</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date *</label>
                            <input type="date" name="planting_date" value={form.planting_date} onChange={handleChange} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Harvest</label>
                            <input type="date" name="expected_harvest_date" value={form.expected_harvest_date} onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                                className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Optional" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50">
                            {saving ? 'Planting…' : 'Plant Crop'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: Record Harvest ──────────────────────────────────────────────────────
const HarvestModal = ({ crop, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({ quantity: '', unit: 'kg', harvest_date: today, grade: 'Unsegregated', notes: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const { data, error: err } = await harvestCrop(crop.id, { ...form, farm_id: crop.farm_id });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">🌾 Record Harvest</h2>
                <p className="text-gray-500 mb-6 text-sm">{crop.name} {crop.variety ? `· ${crop.variety}` : ''}</p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                            <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                            <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="kg, ton, bag…" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade / Quality</label>
                            <input value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="e.g. Grade A, Organic, Unsegregated" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date *</label>
                            <input type="date" value={form.harvest_date} onChange={e => setForm(p => ({ ...p, harvest_date: e.target.value }))} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Optional" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium disabled:opacity-50">
                            {saving ? 'Saving…' : 'Record Harvest'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: Record Sale ─────────────────────────────────────────────────────────
const SaleModal = ({ crop, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({ quantity: '', unit: 'kg', unit_price: '', buyer_name: '', sale_date: today, grade: 'Unsegregated', notes: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const total = form.quantity && form.unit_price
        ? (parseFloat(form.quantity) * parseFloat(form.unit_price)).toLocaleString('en-IN')
        : '—';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const { data, error: err } = await sellCrop(crop.id, { ...form, farm_id: crop.farm_id });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">💰 Record Sale</h2>
                <p className="text-gray-500 mb-6 text-sm">{crop.name} {crop.variety ? `· ${crop.variety}` : ''}</p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                            <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                            <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="kg, ton…" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price per unit (₹) *</label>
                            <input type="number" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade / Quality</label>
                            <input value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="e.g. Grade A" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date *</label>
                            <input type="date" value={form.sale_date} onChange={e => setForm(p => ({ ...p, sale_date: e.target.value }))} required
                                className="w-full border border-gray-300 rounded-lg p-2.5" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                            <input value={form.buyer_name} onChange={e => setForm(p => ({ ...p, buyer_name: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="Optional" />
                        </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm font-semibold text-green-800">Total Revenue: ₹{total}</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
                            {saving ? 'Saving…' : 'Record Sale'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: Segregate ──────────────────────────────────────────────────────────
const SegregationModal = ({ crop, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const [batches, setBatches] = useState([{ grade: '', quantity: '' }]);
    const [date, setDate] = useState(today);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const unsegQty = crop.inventory && crop.inventory['Unsegregated'] ? Number(crop.inventory['Unsegregated']) : 0;
    const totalAllocated = batches.reduce((sum, b) => sum + (parseFloat(b.quantity) || 0), 0);
    const remaining = unsegQty - totalAllocated;

    const addBatch = () => setBatches(p => [...p, { grade: '', quantity: '' }]);
    const removeBatch = (i) => setBatches(p => p.filter((_, idx) => idx !== i));
    const updateBatch = (i, field, val) => setBatches(p => p.map((b, idx) => idx === i ? { ...b, [field]: val } : b));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const valid = batches.filter(b => b.grade.trim() && parseFloat(b.quantity) > 0);
        if (valid.length === 0) { setError('Add at least one grade with a quantity.'); return; }
        if (remaining < 0) { setError(`Total allocated exceeds available stock of ${unsegQty}.`); return; }
        
        setSaving(true);
        const { error: err } = await segregateCrop(crop.id, { 
            farm_id: crop.farm_id, date, unit: 'kg', 
            batches: valid.map(b => ({ grade: b.grade.trim(), quantity: parseFloat(b.quantity) })) 
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">🗂️ Segregate Harvest</h2>
                <p className="text-gray-500 mb-6 text-sm">{crop.name} — Unsegregated stock: <span className="font-bold text-green-700">{unsegQty}</span></p>
                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Segregation</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                            className="w-full border border-gray-300 rounded-lg p-2.5" />
                    </div>
                    
                    <p className="text-sm font-medium text-gray-700 pt-2">Assign quantities to grades:</p>
                    <div className="space-y-2">
                        {batches.map((b, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input placeholder="Grade (e.g. Premium)" value={b.grade} onChange={e => updateBatch(i, 'grade', e.target.value)}
                                    className="flex-1 rounded-lg border border-gray-300 p-2 text-sm" />
                                <input type="number" min="0" placeholder="Qty" value={b.quantity} onChange={e => updateBatch(i, 'quantity', e.target.value)}
                                    className="w-24 rounded-lg border border-gray-300 p-2 text-sm" />
                                {batches.length > 1 && (
                                    <button type="button" onClick={() => removeBatch(i)} className="text-red-400 hover:text-red-600 px-2 font-bold">×</button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addBatch} className="text-green-600 text-sm hover:text-green-800 font-medium">+ Add another grade</button>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 border rounded-lg text-gray-700">Cancel</button>
                        <button type="submit" disabled={saving || remaining < 0}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50">
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Modal: History ─────────────────────────────────────────────────────────────
const HistoryModal = ({ crop, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCropHistory(crop.id, crop.farm_id).then(({ data }) => {
            setHistory(data || []);
            setLoading(false);
        });
    }, [crop.id, crop.farm_id]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">📜 Crop History</h2>
                        <p className="text-gray-500 text-sm">{crop.name} {crop.variety ? `· ${crop.variety}` : ''}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    {loading ? <Spinner /> : history.length === 0 ? <p className="text-gray-500 text-center py-10">No history found.</p> : (
                        <div className="space-y-4">
                            {history.map((h, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl border bg-gray-50">
                                    <div className="text-2xl">{h.type === 'harvest' ? '🌾' : h.type === 'sale' ? '💰' : '🗂️'}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <p className="font-semibold text-gray-800 capitalize">{h.type}</p>
                                            <p className="text-sm text-gray-500">{h.date?.split('T')[0]}</p>
                                        </div>
                                        {h.type === 'harvest' && <p className="text-sm text-gray-600">Harvested {h.quantity} {h.unit} ({h.grade})</p>}
                                        {h.type === 'sale' && <p className="text-sm text-gray-600">Sold {h.quantity} {h.unit} ({h.grade}) for ₹{h.total_amount} {h.buyer_name ? `to ${h.buyer_name}` : ''}</p>}
                                        {h.type === 'segregation' && <p className="text-sm text-gray-600">Segregated {h.quantity} {h.unit} from {h.source_grade} → {h.target_grade}</p>}
                                        {h.notes && <p className="text-xs text-gray-400 mt-1 italic">{h.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main CropsPage ─────────────────────────────────────────────────────────────
export default function CropsPage() {
    const { currentFarm } = useAuth();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null); // null | 'plant' | { type: 'harvest'|'sell', crop }
    const [tab, setTab] = useState('active');

    const load = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        const { data, error: err } = await getCrops(currentFarm.id);
        setLoading(false);
        if (err) { setError(err); return; }
        setCrops(data || []);
    }, [currentFarm?.id]);

    useEffect(() => { load(); }, [load]);

    const filtered = crops.filter(c => tab === 'archived' ? c.is_archived : !c.is_archived);

    if (!currentFarm) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Select a farm to view crops.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Crops</h1>
                    <p className="text-gray-500 mt-1">{currentFarm.name} — track planting, harvest & sales</p>
                </div>
                <button onClick={() => setModal('plant')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-lg transition-all">
                    <span className="text-lg">+</span> Plant Crop
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {['active', 'archived'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                            tab === t
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                        }`}>
                        {t} Crops
                    </button>
                ))}
            </div>

            {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">{error}</div>}

            {loading ? <Spinner /> : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-16 text-center">
                    <div className="text-6xl mb-4">🌱</div>
                    <p className="text-gray-500 text-lg">No crops found. Plant your first crop!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(crop => (
                        <div key={crop.id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6">
                                <div className="mb-3">
                                    <h3 className="text-lg font-bold text-gray-800">{crop.name}</h3>
                                    {crop.variety && <p className="text-sm text-gray-500">{crop.variety}</p>}
                                </div>

                            <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                                {crop.area_planted && (
                                    <p>📐 {crop.area_planted} {crop.area_unit}</p>
                                )}
                                <p>📅 Planted: {crop.planting_date?.split('T')[0] || crop.planting_date}</p>
                                {crop.expected_harvest_date && (
                                    <p>🗓️ Expected: {crop.expected_harvest_date?.split('T')[0] || crop.expected_harvest_date}</p>
                                )}
                                
                                {Number(crop.total_harvested) > 0 && (
                                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-green-800 text-sm">
                                                Available: {Number(crop.total_harvested) - Number(crop.total_sold)}
                                            </p>
                                            <p className="text-xs text-green-700">
                                                Harvested: {crop.total_harvested} | Sold: {crop.total_sold}
                                            </p>
                                        </div>
                                        {crop.inventory && Object.entries(crop.inventory).filter(([_, qty]) => Number(qty) > 0).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-green-200">
                                                {Object.entries(crop.inventory)
                                                    .filter(([_, qty]) => Number(qty) > 0)
                                                    .map(([grade, qty]) => (
                                                    <span key={grade} className="bg-white text-green-800 px-2 py-1 rounded text-xs shadow-sm border border-green-100">
                                                        {grade}: <b>{qty}</b>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {crop.notes && <p className="italic text-gray-400 text-xs mt-2">{crop.notes}</p>}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-3 border-t">
                                <button onClick={() => setModal({ type: 'history', crop })}
                                    className="w-full mb-1 py-1.5 text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-all">
                                    📜 View History
                                </button>
                                <button onClick={() => setModal({ type: 'harvest', crop })}
                                    className="flex-1 min-w-[45%] py-1.5 text-xs font-medium bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200 transition-all">
                                    🌾 Harvest
                                </button>
                                {Number(crop.total_harvested) > Number(crop.total_sold) && (
                                    <button onClick={() => setModal({ type: 'sell', crop })}
                                        className="flex-1 min-w-[45%] py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all">
                                        💰 Sell
                                    </button>
                                )}
                                {crop.inventory && Number(crop.inventory['Unsegregated']) > 0 && (
                                    <button onClick={() => setModal({ type: 'segregate', crop })}
                                        className="flex-1 min-w-[45%] py-1.5 text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-all">
                                        🗂️ Segregate
                                    </button>
                                )}
                                {!crop.is_archived ? (
                                    <button onClick={() => updateCrop(crop.id, { ...crop, farm_id: crop.farm_id, is_archived: true }).then(load)}
                                        className="flex-1 min-w-[45%] py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-all">
                                        📦 Archive
                                    </button>
                                ) : (
                                    <button onClick={() => updateCrop(crop.id, { ...crop, farm_id: crop.farm_id, is_archived: false }).then(load)}
                                        className="flex-1 min-w-[45%] py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-all">
                                        📦 Unarchive
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {modal === 'plant' && (
                <PlantModal farmId={currentFarm.id} onClose={() => setModal(null)} onSaved={load} />
            )}
            {modal?.type === 'harvest' && (
                <HarvestModal crop={modal.crop} onClose={() => setModal(null)} onSaved={load} />
            )}
            {modal?.type === 'sell' && (
                <SaleModal crop={modal.crop} onClose={() => setModal(null)} onSaved={load} />
            )}
            {modal?.type === 'segregate' && (
                <SegregationModal crop={modal.crop} onClose={() => setModal(null)} onSaved={load} />
            )}
            {modal?.type === 'history' && (
                <HistoryModal crop={modal.crop} onClose={() => setModal(null)} />
            )}
        </div>
    );
}
