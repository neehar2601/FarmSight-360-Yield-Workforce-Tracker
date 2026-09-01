import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getCrops, createCrop, updateCrop, archiveCrop,
    harvestCrop, sellCrop, segregateCrop, getCropHistory
} from '../../utils/farmApi';

// ── Spinner ────────────────────────────────────────────────────────────────────
const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500" />
    </div>
);

// ── Modal wrapper ──────────────────────────────────────────────────────────────
const Modal = ({ onClose, children }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
        <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

// ── Field helper ──────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">{label}</label>
        {children}
    </div>
);

const Input = (props) => (
    <input {...props} className={`w-full border-2 border-gray-200 focus:border-green-400 rounded-xl p-3 text-base outline-none transition-colors ${props.className || ''}`} />
);

// ── Modal: Add Crop ────────────────────────────────────────────────────────────
const AddCropModal = ({ farmId, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const [name, setName] = useState('');
    const [variety, setVariety] = useState('');
    const [plantingDate, setPlantingDate] = useState(today);
    const [area, setArea] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('Please enter a crop name.'); return; }
        setSaving(true);
        const { data, error: err } = await createCrop({
            name: name.trim(), variety: variety.trim(), area_planted: area || null,
            area_unit: 'acres', planting_date: plantingDate, farm_id: farmId,
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved(data);
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">🌱 Add Crop</h2>
            <p className="text-gray-400 text-sm mb-6">What are you planting?</p>
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Crop Name *">
                    <Input placeholder="e.g. Wheat, Maize, Tomatoes" value={name} onChange={e => setName(e.target.value)} required />
                </Field>
                <Field label="Variety (Optional)">
                    <Input placeholder="e.g. Desi, Hybrid" value={variety} onChange={e => setVariety(e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Area Planted">
                        <Input type="number" placeholder="e.g. 5" value={area} onChange={e => setArea(e.target.value)} />
                    </Field>
                    <Field label="Planting Date *">
                        <Input type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} required />
                    </Field>
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold disabled:opacity-50">
                        {saving ? 'Adding…' : 'Add Crop'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// ── Modal: Record Harvest ──────────────────────────────────────────────────────
const HarvestModal = ({ crop, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const [qty, setQty] = useState('');
    const [unit, setUnit] = useState('kg');
    const [date, setDate] = useState(today);
    const [isSegregated, setIsSegregated] = useState(false);
    const [grade, setGrade] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!qty || parseFloat(qty) <= 0) { setError('Please enter a valid quantity.'); return; }
        setSaving(true);
        const { data, error: err } = await harvestCrop(crop.id, {
            farm_id: crop.farm_id, quantity: parseFloat(qty), unit, harvest_date: date,
            grade: isSegregated && grade.trim() ? grade.trim() : 'Unsegregated',
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved(data);
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">🌾 Record Harvest</h2>
            <p className="text-gray-400 text-sm mb-6">{crop.name}{crop.variety ? ` · ${crop.variety}` : ''}</p>
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Quantity *">
                        <Input type="number" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} required />
                    </Field>
                    <Field label="Unit">
                        <select value={unit} onChange={e => setUnit(e.target.value)}
                            className="w-full border-2 border-gray-200 focus:border-green-400 rounded-xl p-3 text-base outline-none">
                            <option value="kg">kg</option>
                            <option value="ton">ton</option>
                            <option value="quintal">quintal</option>
                            <option value="bag">bag</option>
                        </select>
                    </Field>
                </div>
                <Field label="Date of Harvest">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </Field>

                {/* Segregation toggle */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <p className="font-semibold text-gray-700 mb-3">Is this harvest already sorted by quality/grade?</p>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsSegregated(false)}
                            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${!isSegregated ? 'bg-amber-400 text-white shadow' : 'bg-white border-2 border-amber-200 text-gray-600'}`}>
                            No — Sort Later
                        </button>
                        <button type="button" onClick={() => setIsSegregated(true)}
                            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${isSegregated ? 'bg-green-500 text-white shadow' : 'bg-white border-2 border-gray-200 text-gray-600'}`}>
                            Yes — Sorted
                        </button>
                    </div>
                    {isSegregated && (
                        <div className="mt-3">
                            <Field label="Grade / Quality Name">
                                <Input placeholder="e.g. Premium, Grade A, Export" value={grade} onChange={e => setGrade(e.target.value)} />
                            </Field>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold disabled:opacity-50">
                        {saving ? 'Saving…' : 'Record Harvest'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// ── Modal: Sell Crop ───────────────────────────────────────────────────────────
const SellModal = ({ crop, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const available = Number(crop.total_harvested) - Number(crop.total_sold);
    const availableGrades = crop.inventory
        ? Object.entries(crop.inventory).filter(([, q]) => Number(q) > 0)
        : [];

    const [qty, setQty] = useState('');
    const [unit, setUnit] = useState('kg');
    const [price, setPrice] = useState('');
    const [grade, setGrade] = useState(availableGrades[0]?.[0] || 'Unsegregated');
    const [buyer, setBuyer] = useState('');
    const [date, setDate] = useState(today);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const total = qty && price ? (parseFloat(qty) * parseFloat(price)).toLocaleString('en-IN') : '—';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!qty || parseFloat(qty) <= 0) { setError('Please enter a valid quantity.'); return; }
        if (parseFloat(qty) > available) { setError(`Only ${available} is available to sell.`); return; }
        if (!price || parseFloat(price) <= 0) { setError('Please enter a price.'); return; }
        setSaving(true);
        const { data, error: err } = await sellCrop(crop.id, {
            farm_id: crop.farm_id, quantity: parseFloat(qty), unit, unit_price: parseFloat(price),
            grade, buyer_name: buyer, sale_date: date,
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved(data);
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">💰 Sell Crop</h2>
            <p className="text-gray-400 text-sm mb-1">{crop.name}{crop.variety ? ` · ${crop.variety}` : ''}</p>
            <p className="text-green-700 font-semibold text-sm mb-6">Available to sell: {available}</p>
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                {availableGrades.length > 1 && (
                    <Field label="Selling which grade?">
                        <select value={grade} onChange={e => setGrade(e.target.value)}
                            className="w-full border-2 border-gray-200 focus:border-green-400 rounded-xl p-3 text-base outline-none">
                            {availableGrades.map(([g, q]) => (
                                <option key={g} value={g}>{g} — {q} available</option>
                            ))}
                        </select>
                    </Field>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Quantity *">
                        <Input type="number" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} required />
                    </Field>
                    <Field label="Unit">
                        <select value={unit} onChange={e => setUnit(e.target.value)}
                            className="w-full border-2 border-gray-200 focus:border-green-400 rounded-xl p-3 text-base outline-none">
                            <option value="kg">kg</option>
                            <option value="ton">ton</option>
                            <option value="quintal">quintal</option>
                            <option value="bag">bag</option>
                        </select>
                    </Field>
                </div>
                <Field label="Price per unit (₹) *">
                    <Input type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} required />
                </Field>
                <Field label="Sale Date">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </Field>
                <Field label="Buyer Name (Optional)">
                    <Input placeholder="e.g. Ravi Traders" value={buyer} onChange={e => setBuyer(e.target.value)} />
                </Field>

                {qty && price && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-green-700">₹{total}</p>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">
                        {saving ? 'Saving…' : 'Record Sale'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// ── Modal: Segregate ──────────────────────────────────────────────────────────
const SegregateModal = ({ crop, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const unsegQty = Number(crop.inventory?.['Unsegregated'] || 0);
    const [batches, setBatches] = useState([{ grade: '', quantity: '' }]);
    const [date, setDate] = useState(today);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const totalAllocated = batches.reduce((s, b) => s + (parseFloat(b.quantity) || 0), 0);
    const remaining = unsegQty - totalAllocated;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const valid = batches.filter(b => b.grade.trim() && parseFloat(b.quantity) > 0);
        if (!valid.length) { setError('Add at least one grade.'); return; }
        if (remaining < 0) { setError(`Total exceeds available ${unsegQty}.`); return; }
        setSaving(true);
        const { error: err } = await segregateCrop(crop.id, {
            farm_id: crop.farm_id, date, unit: 'kg',
            batches: valid.map(b => ({ grade: b.grade.trim(), quantity: parseFloat(b.quantity) })),
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved();
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">🗂️ Sort Harvest by Grade</h2>
            <p className="text-gray-400 text-sm mb-2">{crop.name} — Unsorted stock: <span className="font-bold text-amber-600">{unsegQty}</span></p>
            {remaining >= 0
                ? <p className="text-green-700 text-sm font-semibold mb-5">Remaining to assign: {remaining}</p>
                : <p className="text-red-600 text-sm font-semibold mb-5">Over by {Math.abs(remaining)} — reduce quantities</p>
            }
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Date">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </Field>
                <div className="space-y-2">
                    {batches.map((b, i) => (
                        <div key={i} className="flex gap-2">
                            <Input placeholder="Grade name (e.g. Premium)" value={b.grade}
                                onChange={e => setBatches(p => p.map((x, j) => j === i ? { ...x, grade: e.target.value } : x))} />
                            <Input type="number" placeholder="Qty" value={b.quantity}
                                className="w-24"
                                onChange={e => setBatches(p => p.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} />
                            {batches.length > 1 && (
                                <button type="button" onClick={() => setBatches(p => p.filter((_, j) => j !== i))}
                                    className="text-red-400 hover:text-red-600 text-xl font-bold px-1">×</button>
                            )}
                        </div>
                    ))}
                </div>
                <button type="button" onClick={() => setBatches(p => [...p, { grade: '', quantity: '' }])}
                    className="text-green-600 font-semibold text-sm">+ Add Grade</button>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold">Cancel</button>
                    <button type="submit" disabled={saving || remaining < 0}
                        className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold disabled:opacity-50">
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
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

    const icon = { harvest: '🌾', sale: '💰', segregation: '🗂️' };
    const color = { harvest: 'bg-amber-50 border-amber-200', sale: 'bg-blue-50 border-blue-200', segregation: 'bg-purple-50 border-purple-200' };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">📜 History</h2>
                        <p className="text-gray-400 text-sm">{crop.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? <Spinner /> : history.length === 0
                        ? <p className="text-gray-400 text-center py-10">No activity yet.</p>
                        : history.map((h, i) => (
                            <div key={i} className={`flex gap-3 p-4 rounded-xl border-2 ${color[h.type] || 'bg-gray-50 border-gray-200'}`}>
                                <span className="text-2xl">{icon[h.type] || '•'}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-gray-800 capitalize">{h.type}</p>
                                        <p className="text-xs text-gray-400">{h.date?.split('T')[0]}</p>
                                    </div>
                                    {h.type === 'harvest' && <p className="text-sm text-gray-600 mt-0.5">Harvested <b>{h.quantity} {h.unit}</b> · {h.grade}</p>}
                                    {h.type === 'sale' && <p className="text-sm text-gray-600 mt-0.5">Sold <b>{h.quantity} {h.unit}</b> ({h.grade}) for <b>₹{h.total_amount}</b>{h.buyer_name ? ` to ${h.buyer_name}` : ''}</p>}
                                    {h.type === 'segregation' && <p className="text-sm text-gray-600 mt-0.5">Sorted <b>{h.quantity} {h.unit}</b> · {h.source_grade} → {h.target_grade}</p>}
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

// ── Crop Card ─────────────────────────────────────────────────────────────────
const CropCard = ({ crop, onAction, onArchive }) => {
    const available = Number(crop.total_harvested) - Number(crop.total_sold);
    const hasUnsegregated = Number(crop.inventory?.['Unsegregated'] || 0) > 0;
    const grades = crop.inventory
        ? Object.entries(crop.inventory).filter(([, q]) => Number(q) > 0)
        : [];

    return (
        <div className="bg-white rounded-2xl border-2 border-gray-100 hover:border-green-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Card header */}
            <div className="p-5 pb-3">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{crop.name}</h3>
                        {crop.variety && <p className="text-sm text-gray-400">{crop.variety}</p>}
                    </div>
                    <button onClick={() => onAction('history')}
                        className="text-xs text-gray-400 hover:text-gray-600 underline mt-1">History</button>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    {crop.area_planted && <span>📐 {crop.area_planted} {crop.area_unit}</span>}
                    <span>📅 {crop.planting_date?.split('T')[0] || crop.planting_date}</span>
                </div>

                {/* Inventory panel */}
                {Number(crop.total_harvested) > 0 ? (
                    <div className="bg-green-50 rounded-xl p-3 mb-1">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-green-800 font-bold text-base">In Stock: {available}</span>
                            <div className="text-right text-xs text-green-600">
                                <p>Harvested: {crop.total_harvested}</p>
                                <p>Sold: {crop.total_sold}</p>
                            </div>
                        </div>
                        {grades.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {grades.map(([grade, qty]) => (
                                    <span key={grade} className={`text-xs px-2 py-1 rounded-lg font-semibold ${grade === 'Unsegregated' ? 'bg-amber-100 text-amber-800' : 'bg-white text-green-800 border border-green-200'}`}>
                                        {grade}: {qty}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 mb-1">No harvests recorded yet.</p>
                )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 space-y-2">
                <button onClick={() => onAction('harvest')}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-white rounded-xl font-bold text-base transition-all active:scale-95">
                    🌾 Record Harvest
                </button>
                {available > 0 && (
                    <button onClick={() => onAction('sell')}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-base transition-all active:scale-95">
                        💰 Sell Crop
                    </button>
                )}
                {hasUnsegregated && (
                    <button onClick={() => onAction('segregate')}
                        className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-base transition-all active:scale-95">
                        🗂️ Sort by Grade
                    </button>
                )}
                <button onClick={onArchive}
                    className="w-full py-2 text-gray-400 hover:text-gray-600 text-xs font-medium transition-all">
                    {crop.is_archived ? '📦 Unarchive' : 'Archive this crop'}
                </button>
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
    const [modal, setModal] = useState(null);
    const [tab, setTab] = useState('active');

    const load = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        const { data, error: err } = await getCrops(currentFarm.id, tab === 'archived');
        setLoading(false);
        if (err) { setError(err); return; }
        setCrops(data || []);
    }, [currentFarm?.id, tab]);

    useEffect(() => { load(); }, [load]);

    const filtered = crops; // already pre-filtered by the backend

    if (!currentFarm) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-lg">Select a farm to view crops.</p>
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Crops</h1>
                    <p className="text-gray-400 mt-0.5">{currentFarm.name}</p>
                </div>
                <button onClick={() => setModal({ type: 'addCrop' })}
                    className="flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95">
                    <span className="text-xl">+</span> Add Crop
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[['active', 'My Crops'], ['archived', 'Archived']].map(([t, label]) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${tab === t ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {error && <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-4">{error}</div>}

            {loading ? <Spinner /> : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
                    <div className="text-6xl mb-4">🌱</div>
                    <p className="text-gray-400 text-lg font-medium">
                        {tab === 'archived' ? 'No archived crops.' : 'No crops yet. Add your first crop!'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(crop => (
                        <CropCard key={crop.id} crop={crop}
                            onAction={(type) => setModal({ type, crop })}
                            onArchive={() => archiveCrop(crop.id, crop.farm_id, !crop.is_archived).then(load)}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {modal?.type === 'addCrop' && <AddCropModal farmId={currentFarm.id} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === 'harvest' && <HarvestModal crop={modal.crop} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === 'sell' && <SellModal crop={modal.crop} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === 'segregate' && <SegregateModal crop={modal.crop} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === 'history' && <HistoryModal crop={modal.crop} onClose={() => setModal(null)} />}
        </div>
    );
}
