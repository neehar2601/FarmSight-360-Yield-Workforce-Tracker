import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getCrops, createCrop, updateCrop,
    harvestCrop, sellCrop
} from '../../utils/farmApi';

const STATUS_COLORS = {
    growing: 'bg-green-100 text-green-800',
    harvested: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
};

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
    const [form, setForm] = useState({ quantity: '', unit: 'kg', harvest_date: today, notes: '' });
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
    const [form, setForm] = useState({ quantity: '', unit: 'kg', unit_price: '', buyer_name: '', sale_date: today, notes: '' });
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

// ── Main CropsPage ─────────────────────────────────────────────────────────────
export default function CropsPage() {
    const { currentFarm } = useAuth();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null); // null | 'plant' | { type: 'harvest'|'sell', crop }
    const [statusFilter, setStatusFilter] = useState('all');

    const load = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        const { data, error: err } = await getCrops(currentFarm.id);
        setLoading(false);
        if (err) { setError(err); return; }
        setCrops(data || []);
    }, [currentFarm?.id]);

    useEffect(() => { load(); }, [load]);

    const filtered = statusFilter === 'all' ? crops : crops.filter(c => c.status === statusFilter);

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

            {/* Status filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'growing', 'harvested', 'sold', 'failed'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                            statusFilter === s
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                        }`}>
                        {s}
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
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{crop.name}</h3>
                                    {crop.variety && <p className="text-sm text-gray-500">{crop.variety}</p>}
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[crop.status] || 'bg-gray-100 text-gray-600'}`}>
                                    {crop.status}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                                {crop.area_planted && (
                                    <p>📐 {crop.area_planted} {crop.area_unit}</p>
                                )}
                                <p>📅 Planted: {crop.planting_date?.split('T')[0] || crop.planting_date}</p>
                                {crop.expected_harvest_date && (
                                    <p>🗓️ Expected: {crop.expected_harvest_date?.split('T')[0] || crop.expected_harvest_date}</p>
                                )}
                                {crop.notes && <p className="italic text-gray-400 text-xs">{crop.notes}</p>}
                            </div>

                            <div className="flex gap-2 pt-3 border-t">
                                {crop.status === 'growing' && (
                                    <button onClick={() => setModal({ type: 'harvest', crop })}
                                        className="flex-1 py-1.5 text-xs font-medium bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200 transition-all">
                                        🌾 Harvest
                                    </button>
                                )}
                                {(crop.status === 'harvested' || crop.status === 'growing') && (
                                    <button onClick={() => setModal({ type: 'sell', crop })}
                                        className="flex-1 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all">
                                        💰 Sell
                                    </button>
                                )}
                                <button onClick={() => updateCrop(crop.id, { ...crop, farm_id: crop.farm_id, status: 'failed' }).then(load)}
                                    className="py-1.5 px-2 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-all">
                                    ✗ Failed
                                </button>
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
        </div>
    );
}
