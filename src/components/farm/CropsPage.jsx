import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getCrops, createCrop, updateCrop, archiveCrop,
    harvestCrop, sellCrop, segregateCrop, getCropHistory,
    plantCropFromStock, buyCropPlantingMaterial
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
    const [cropType, setCropType] = useState('seasonal'); // 'seasonal' | 'perennial'
    const [plantingDate, setPlantingDate] = useState(today);
    const [area, setArea] = useState('');
    
    // Planting Material state
    const [materialSource, setMaterialSource] = useState('purchased'); // 'purchased' | 'farm_saved' | 'existing_crop' | 'none'
    const [materialCategory, setMaterialCategory] = useState('Seeds');
    const [itemName, setItemName] = useState('');
    const [unit, setUnit] = useState('kg');
    const [qtyBought, setQtyBought] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [qtyPlantedNow, setQtyPlantedNow] = useState('');
    const [vendor, setVendor] = useState('');
    const [matNotes, setMatNotes] = useState('');
    
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Auto-align defaults when cropType changes
    const handleCropTypeChange = (type) => {
        setCropType(type);
        if (type === 'perennial') {
            setMaterialCategory('Plants/Seedlings');
            setUnit('saplings');
        } else {
            setMaterialCategory('Seeds');
            setUnit('kg');
        }
    };

    const totalOutlay = (parseFloat(qtyBought) || 0) * (parseFloat(unitPrice) || 0);
    const nurseryRemaining = Math.max(0, (parseFloat(qtyBought) || 0) - (parseFloat(qtyPlantedNow) || 0));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('Please enter a crop name.'); return; }
        
        let planting_material = null;
        if (materialSource === 'purchased') {
            const bought = parseFloat(qtyBought);
            const price = parseFloat(unitPrice);
            if (bought && bought > 0) {
                if (price === undefined || isNaN(price) || price < 0) {
                    setError('Please specify unit price (₹) for purchased seeds/plants.');
                    return;
                }
                const planted = qtyPlantedNow === '' ? bought : parseFloat(qtyPlantedNow);
                if (planted < 0 || planted > bought) {
                    setError('Planted count cannot exceed total quantity bought.');
                    return;
                }
                planting_material = {
                    source_type: 'purchased',
                    category: materialCategory,
                    item_name: itemName.trim() || `${name.trim()} ${materialCategory === 'Seeds' ? 'Seeds' : 'Saplings'}`,
                    unit,
                    quantity_bought: bought,
                    unit_price: price,
                    quantity_planted_now: planted,
                    vendor_name: vendor.trim() || undefined,
                    notes: matNotes.trim() || undefined
                };
            }
        } else if (materialSource === 'farm_saved') {
            const qty = parseFloat(qtyPlantedNow || qtyBought);
            if (qty && qty > 0) {
                planting_material = {
                    source_type: 'farm_saved',
                    category: materialCategory,
                    item_name: itemName.trim() || `${name.trim()} (Farm-Saved)`,
                    unit,
                    quantity_bought: parseFloat(qtyBought) || qty,
                    unit_price: 0,
                    quantity_planted_now: qty,
                    notes: matNotes.trim() || 'Self-propagated / farm-saved stock'
                };
            }
        } else if (materialSource === 'existing_crop') {
            const standing = parseFloat(qtyPlantedNow);
            if (standing && standing > 0) {
                planting_material = {
                    source_type: 'existing_crop',
                    category: materialCategory,
                    item_name: itemName.trim() || `${name.trim()} (Standing Plantation)`,
                    unit: unit === 'kg' ? 'trees/plants' : unit,
                    quantity_bought: standing,
                    unit_price: 0,
                    quantity_planted_now: standing,
                    notes: matNotes.trim() || 'Established standing plantation'
                };
            }
        }

        setSaving(true);
        const { data, error: err } = await createCrop({
            farm_id: farmId,
            name: name.trim(),
            variety: variety.trim() || null,
            crop_type: cropType,
            area_planted: area || null,
            area_unit: 'acres',
            planting_date: plantingDate,
            planting_material: planting_material || undefined
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved(data);
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🌱</span>
                <h2 className="text-2xl font-bold text-gray-800">Add Crop</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Record new crop planting & material inventory</p>
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-4">{error}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Crop Type Pill Toggle */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Crop Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => handleCropTypeChange('seasonal')}
                            className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${cropType === 'seasonal' ? 'border-green-500 bg-green-50 text-green-800 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                        >
                            <span>🌾</span> Seasonal (Wheat, Tomato)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCropTypeChange('perennial')}
                            className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${cropType === 'perennial' ? 'border-green-500 bg-green-50 text-green-800 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                        >
                            <span>🌴</span> Perennial (Arecanut, Palm)
                        </button>
                    </div>
                </div>

                <Field label="Crop Name *">
                    <Input placeholder="e.g. Arecanut, Wheat, Tomato, Paddy" value={name} onChange={e => setName(e.target.value)} required />
                </Field>

                <Field label="Variety (Optional)">
                    <Input placeholder="e.g. Mangala Hybrid, Sharbati, Roma" value={variety} onChange={e => setVariety(e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Area Planted (acres)">
                        <Input type="number" step="any" placeholder="e.g. 2.5" value={area} onChange={e => setArea(e.target.value)} />
                    </Field>
                    <Field label="Planting Date *">
                        <Input type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} required />
                    </Field>
                </div>

                {/* Seeds & Planting Material Section */}
                <div className="border-2 border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                            <span>🌱</span> Planting Material / Seeds
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">Tracks stock & costs</span>
                    </div>

                    {/* Source selector */}
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                        {[
                            ['purchased', '🛒 Purchased'],
                            ['farm_saved', '🌿 Farm-Saved'],
                            ['existing_crop', '🌳 Standing Trees'],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setMaterialSource(key)}
                                className={`py-2 px-1 rounded-xl font-bold transition-all text-center ${materialSource === key ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-emerald-200 text-emerald-900 hover:bg-emerald-50'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {materialSource === 'purchased' && (
                        <div className="space-y-3 pt-1">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                                    <select 
                                        value={materialCategory} 
                                        onChange={e => {
                                            setMaterialCategory(e.target.value);
                                            if (e.target.value === 'Seeds' && unit === 'saplings') setUnit('kg');
                                            if (e.target.value === 'Plants/Seedlings' && unit === 'kg') setUnit('saplings');
                                        }}
                                        className="w-full border-2 border-gray-200 rounded-xl p-2.5 text-sm outline-none bg-white"
                                    >
                                        <option value="Seeds">Seeds</option>
                                        <option value="Plants/Seedlings">Plants / Seedlings / Saplings</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label>
                                    <select 
                                        value={unit} 
                                        onChange={e => setUnit(e.target.value)}
                                        className="w-full border-2 border-gray-200 rounded-xl p-2.5 text-sm outline-none bg-white"
                                    >
                                        <option value="saplings">saplings</option>
                                        <option value="kg">kg</option>
                                        <option value="packets">packets</option>
                                        <option value="grams">grams</option>
                                        <option value="bags">bags</option>
                                        <option value="Pc">pieces (Pc)</option>
                                    </select>
                                </div>
                            </div>

                            <Field label="Material / Variety Name">
                                <Input 
                                    placeholder={name ? `${name} ${materialCategory === 'Seeds' ? 'Seeds' : 'Saplings'}` : 'e.g. Mangala Arecanut Saplings'} 
                                    value={itemName} 
                                    onChange={e => setItemName(e.target.value)} 
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-2">
                                <Field label={`Quantity Bought (${unit}) *`}>
                                    <Input 
                                        type="number" 
                                        step="any" 
                                        placeholder="e.g. 500" 
                                        value={qtyBought} 
                                        onChange={e => {
                                            setQtyBought(e.target.value);
                                            if (!qtyPlantedNow) setQtyPlantedNow(e.target.value);
                                        }} 
                                    />
                                </Field>
                                <Field label="Price per Unit (₹) *">
                                    <Input 
                                        type="number" 
                                        step="any" 
                                        placeholder="e.g. 80" 
                                        value={unitPrice} 
                                        onChange={e => setUnitPrice(e.target.value)} 
                                    />
                                </Field>
                            </div>

                            {totalOutlay > 0 && (
                                <div className="bg-emerald-100/70 rounded-xl p-2.5 flex justify-between items-center text-xs">
                                    <span className="text-emerald-900 font-semibold">Total Material Cost:</span>
                                    <span className="text-emerald-950 font-black text-sm">₹{totalOutlay.toLocaleString('en-IN')}</span>
                                </div>
                            )}

                            {/* Split field planting vs nursery stock */}
                            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-gray-700">Planted Today vs Nursery Stock</span>
                                    <span className="font-semibold text-amber-800">
                                        {nurseryRemaining > 0 ? `${nurseryRemaining} ${unit} to Nursery` : '100% planted'}
                                    </span>
                                </div>
                                <Input 
                                    type="number" 
                                    step="any" 
                                    placeholder={qtyBought || "0"} 
                                    value={qtyPlantedNow} 
                                    onChange={e => setQtyPlantedNow(e.target.value)} 
                                    max={qtyBought || undefined}
                                />
                                {nurseryRemaining > 0 ? (
                                    <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                                        🌿 <b>{qtyPlantedNow} {unit}</b> will be marked as planted in field today. <b>{nurseryRemaining} {unit}</b> will remain in farm nursery stock for gap-filling.
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-gray-500 font-medium">
                                        All {qtyBought || 0} {unit} will be recorded as planted in the field immediately.
                                    </p>
                                )}
                            </div>

                            <Field label="Vendor / Nursery Name (Optional)">
                                <Input placeholder="e.g. Sunrise Farm Nursery" value={vendor} onChange={e => setVendor(e.target.value)} />
                            </Field>
                        </div>
                    )}

                    {materialSource === 'farm_saved' && (
                        <div className="space-y-3 pt-1">
                            <p className="text-xs bg-emerald-100/60 text-emerald-900 rounded-xl p-2.5 font-medium">
                                🌿 Sourced from own land or saved from previous harvest. Cash outlay is <b>₹0</b>.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <Field label={`Quantity Planted (${unit})`}>
                                    <Input type="number" step="any" placeholder="e.g. 200" value={qtyPlantedNow} onChange={e => setQtyPlantedNow(e.target.value)} />
                                </Field>
                                <Field label="Unit">
                                    <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-2.5 text-sm bg-white outline-none">
                                        <option value="saplings">saplings</option>
                                        <option value="kg">kg</option>
                                        <option value="packets">packets</option>
                                        <option value="bags">bags</option>
                                    </select>
                                </Field>
                            </div>
                        </div>
                    )}

                    {materialSource === 'existing_crop' && (
                        <div className="space-y-3 pt-1">
                            <p className="text-xs bg-blue-50 text-blue-900 rounded-xl p-2.5 font-medium">
                                🌳 Existing established crop. Records standing trees/plants with <b>₹0 initial expense</b> for current cycle.
                            </p>
                            <Field label="Total Standing Trees / Plants Count">
                                <Input type="number" step="any" placeholder="e.g. 500" value={qtyPlantedNow} onChange={e => setQtyPlantedNow(e.target.value)} />
                            </Field>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50">
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

    const icon = { 
        harvest: '🌾', 
        sale: '💰', 
        segregation: '🗂️', 
        planting: '🌱' 
    };
    const color = { 
        harvest: 'bg-amber-50 border-amber-200', 
        sale: 'bg-blue-50 border-blue-200', 
        segregation: 'bg-purple-50 border-purple-200',
        planting: 'bg-emerald-50 border-emerald-200'
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">📜 Activity Ledger</h2>
                        <p className="text-gray-400 text-sm">{crop.name}{crop.variety ? ` · ${crop.variety}` : ''}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? <Spinner /> : history.length === 0
                        ? <p className="text-gray-400 text-center py-10">No activity recorded yet.</p>
                        : history.map((h, i) => (
                            <div key={i} className={`flex gap-3 p-4 rounded-xl border-2 ${color[h.type] || 'bg-gray-50 border-gray-200'}`}>
                                <span className="text-2xl">{h.type === 'planting' ? (h.action === 'buy' ? '🛒' : '🌱') : (icon[h.type] || '•')}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-gray-800 capitalize">
                                            {h.type === 'planting' 
                                                ? (h.action === 'buy' ? 'Planting Material Inflow' : 'Field Planting / Sowing') 
                                                : h.type}
                                        </p>
                                        <p className="text-xs text-gray-400 font-medium">{h.date?.split('T')[0]}</p>
                                    </div>
                                    {h.type === 'planting' && (
                                        <p className="text-sm text-gray-600 mt-0.5">
                                            {h.action === 'buy' ? (
                                                <>Bought <b>{h.quantity} {h.unit}</b> {h.total_amount > 0 ? `for ₹${Number(h.total_amount).toLocaleString('en-IN')}` : '(₹0 saved stock)'}{h.notes ? ` · ${h.notes}` : ''}</>
                                            ) : (
                                                <>Planted <b>{h.quantity} {h.unit}</b> in field{h.notes ? ` · ${h.notes}` : ''}</>
                                            )}
                                        </p>
                                    )}
                                    {h.type === 'harvest' && <p className="text-sm text-gray-600 mt-0.5">Harvested <b>{h.quantity} {h.unit}</b> · {h.grade}{h.notes ? ` (${h.notes})` : ''}</p>}
                                    {h.type === 'sale' && <p className="text-sm text-gray-600 mt-0.5">Sold <b>{h.quantity} {h.unit}</b> ({h.grade}) for <b>₹{Number(h.total_amount).toLocaleString('en-IN')}</b>{h.buyer_name ? ` to ${h.buyer_name}` : ''}</p>}
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

// ── Modal: Plant / Gap-Fill From Stock ─────────────────────────────────────────
const PlantFromStockModal = ({ crop, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const primaryItem = crop.planting_material || (crop.planting_materials && crop.planting_materials[0]);
    const availableStock = Number(crop.nursery_stock || primaryItem?.nursery_stock || 0);
    const unit = primaryItem?.item_unit || 'saplings';

    const [qty, setQty] = useState('');
    const [date, setDate] = useState(today);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const quantity = parseFloat(qty);
        if (!quantity || quantity <= 0) {
            setError('Please enter a valid quantity.');
            return;
        }
        if (quantity > availableStock) {
            setError(`Only ${availableStock} ${unit} available in nursery stock.`);
            return;
        }
        if (!primaryItem?.item_id) {
            setError('No planting material inventory item linked.');
            return;
        }

        setSaving(true);
        const { data, error: err } = await plantCropFromStock(crop.id, {
            farm_id: crop.farm_id,
            item_id: primaryItem.item_id,
            quantity,
            date,
            notes: notes.trim() || 'Planted / gap-filled from farm nursery stock',
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved();
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🌱</span>
                <h2 className="text-2xl font-bold text-gray-800">Plant / Gap-Fill from Stock</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
                {crop.name}{crop.variety ? ` · ${crop.variety}` : ''}
            </p>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3.5 mb-5 flex justify-between items-center">
                <div>
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Farm Nursery Stock</span>
                    <span className="text-lg font-bold text-emerald-900">{primaryItem?.item_name || 'Saplings'}</span>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600">{availableStock}</span>
                    <span className="text-xs text-emerald-700 ml-1 font-semibold">{unit}</span>
                </div>
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Field label={`Quantity to Plant Now (${unit}) *`}>
                    <div className="relative">
                        <Input 
                            type="number" 
                            step="any"
                            placeholder="0" 
                            value={qty} 
                            onChange={e => setQty(e.target.value)} 
                            max={availableStock}
                            required 
                        />
                        <button
                            type="button"
                            onClick={() => setQty(availableStock.toString())}
                            className="absolute right-3 top-3 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-2 py-1 rounded-lg transition-colors"
                        >
                            Max ({availableStock})
                        </button>
                    </div>
                </Field>

                <Field label="Planting Date *">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </Field>

                <Field label="Notes / Activity (Optional)">
                    <Input 
                        placeholder="e.g. Gap filling in northern row, replacement for damaged palms" 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)} 
                    />
                </Field>

                {qty && parseFloat(qty) > 0 && parseFloat(qty) <= availableStock && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 flex justify-between">
                        <span>Remaining in nursery after planting:</span>
                        <span className="font-bold text-gray-800">{availableStock - parseFloat(qty)} {unit}</span>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving || !qty || parseFloat(qty) <= 0 || parseFloat(qty) > availableStock} 
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50">
                        {saving ? 'Planting…' : 'Confirm Planting'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// ── Modal: Buy Planting Material ──────────────────────────────────────────────
const BuyPlantingMaterialModal = ({ crop, onClose, onSaved }) => {
    const today = new Date().toISOString().split('T')[0];
    const isPerennial = crop.crop_type === 'perennial';
    const primaryItem = crop.planting_material || (crop.planting_materials && crop.planting_materials[0]);

    const [category, setCategory] = useState(isPerennial ? 'Plants/Seedlings' : 'Seeds');
    const [itemName, setItemName] = useState(primaryItem?.item_name || `${crop.name} ${isPerennial ? 'Saplings' : 'Seeds'}`);
    const [unit, setUnit] = useState(primaryItem?.item_unit || (isPerennial ? 'saplings' : 'kg'));
    const [qtyBought, setQtyBought] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [plantNow, setPlantNow] = useState('');
    const [vendor, setVendor] = useState('');
    const [date, setDate] = useState(today);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const totalCost = (parseFloat(qtyBought) || 0) * (parseFloat(unitPrice) || 0);
    const remainingToStock = Math.max(0, (parseFloat(qtyBought) || 0) - (parseFloat(plantNow) || 0));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const bought = parseFloat(qtyBought);
        const price = parseFloat(unitPrice);
        const planted = plantNow === '' ? 0 : parseFloat(plantNow);

        if (!bought || bought <= 0) {
            setError('Please enter quantity bought.');
            return;
        }
        if (price === undefined || isNaN(price) || price < 0) {
            setError('Please enter a valid price.');
            return;
        }
        if (planted < 0 || planted > bought) {
            setError('Planted quantity must be between 0 and quantity bought.');
            return;
        }

        setSaving(true);
        const { data, error: err } = await buyCropPlantingMaterial(crop.id, {
            farm_id: crop.farm_id,
            item_id: primaryItem?.item_id,
            item_name: itemName.trim(),
            category,
            unit,
            quantity_bought: bought,
            unit_price: price,
            quantity_planted_now: planted,
            vendor_name: vendor.trim() || undefined,
            date,
            notes: notes.trim() || undefined,
        });
        setSaving(false);
        if (err) { setError(err); return; }
        onSaved();
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">➕</span>
                <h2 className="text-2xl font-bold text-gray-800">Buy Seeds / Saplings</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">
                Add planting material for {crop.name}{crop.variety ? ` (${crop.variety})` : ''}
            </p>

            {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Category">
                        <select 
                            value={category} 
                            onChange={e => {
                                setCategory(e.target.value);
                                if (e.target.value === 'Seeds' && unit === 'saplings') setUnit('kg');
                                if (e.target.value === 'Plants/Seedlings' && unit === 'kg') setUnit('saplings');
                            }}
                            className="w-full border-2 border-gray-200 focus:border-green-400 rounded-xl p-3 text-base outline-none bg-white"
                        >
                            <option value="Seeds">Seeds</option>
                            <option value="Plants/Seedlings">Plants / Seedlings / Saplings</option>
                        </select>
                    </Field>
                    <Field label="Unit">
                        <select 
                            value={unit} 
                            onChange={e => setUnit(e.target.value)}
                            className="w-full border-2 border-gray-200 focus:border-green-400 rounded-xl p-3 text-base outline-none bg-white"
                        >
                            <option value="saplings">saplings</option>
                            <option value="kg">kg</option>
                            <option value="packets">packets</option>
                            <option value="grams">grams</option>
                            <option value="bags">bags</option>
                            <option value="Pc">pieces (Pc)</option>
                        </select>
                    </Field>
                </div>

                <Field label="Variety / Material Name *">
                    <Input 
                        placeholder="e.g. Mangala Hybrid Arecanut Saplings" 
                        value={itemName} 
                        onChange={e => setItemName(e.target.value)} 
                        required 
                    />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label={`Quantity Bought (${unit}) *`}>
                        <Input 
                            type="number" 
                            step="any"
                            placeholder="0" 
                            value={qtyBought} 
                            onChange={e => {
                                setQtyBought(e.target.value);
                                if (!plantNow) setPlantNow(e.target.value);
                            }} 
                            required 
                        />
                    </Field>
                    <Field label="Cost per Unit (₹) *">
                        <Input 
                            type="number" 
                            step="any"
                            placeholder="0" 
                            value={unitPrice} 
                            onChange={e => setUnitPrice(e.target.value)} 
                            required 
                        />
                    </Field>
                </div>

                {totalCost > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center text-sm">
                        <span className="text-emerald-800 font-semibold">Total Purchase Outlay:</span>
                        <span className="text-emerald-900 font-bold text-lg">₹{totalCost.toLocaleString('en-IN')}</span>
                    </div>
                )}

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Field Planting vs Nursery Stock
                        </label>
                        <span className="text-xs text-amber-700 font-medium">
                            {remainingToStock > 0 ? `${remainingToStock} ${unit} to Nursery` : '100% planted'}
                        </span>
                    </div>
                    <Field label={`How many planted in field immediately? (${unit})`}>
                        <Input 
                            type="number" 
                            step="any"
                            placeholder={qtyBought || "0"} 
                            value={plantNow} 
                            onChange={e => setPlantNow(e.target.value)} 
                            max={qtyBought || undefined}
                        />
                    </Field>
                    {remainingToStock > 0 && (
                        <p className="text-xs text-amber-800 font-medium">
                            🌿 <b>{remainingToStock} {unit}</b> will be kept in farm nursery stock for future planting or gap-filling.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Purchase Date *">
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </Field>
                    <Field label="Vendor / Nursery Name">
                        <Input 
                            placeholder="e.g. Sunrise Nursery" 
                            value={vendor} 
                            onChange={e => setVendor(e.target.value)} 
                        />
                    </Field>
                </div>

                <Field label="Notes (Optional)">
                    <Input 
                        placeholder="e.g. Certified disease-resistant batch" 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)} 
                    />
                </Field>

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving || !qtyBought || parseFloat(qtyBought) <= 0} 
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50">
                        {saving ? 'Recording…' : 'Record Purchase'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// ── Crop Card ─────────────────────────────────────────────────────────────────
const CropCard = ({ crop, onAction, onArchive }) => {
    const available = Number(crop.total_harvested) - Number(crop.total_sold);
    const hasUnsegregated = Number(crop.inventory?.['Unsegregated'] || 0) > 0;
    const grades = crop.inventory
        ? Object.entries(crop.inventory).filter(([, q]) => Number(q) > 0)
        : [];
    
    const isPerennial = crop.crop_type === 'perennial';
    const nurseryStock = Number(crop.nursery_stock || 0);
    const totalPlanted = Number(crop.total_planted || 0);
    const materialUnit = crop.planting_material?.item_unit || (isPerennial ? 'saplings' : 'kg');

    return (
        <div className="bg-white rounded-2xl border-2 border-gray-100 hover:border-green-300 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between">
            {/* Card header */}
            <div className="p-5 pb-3">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-800">{crop.name}</h3>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isPerennial ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                                {isPerennial ? '🌴 Perennial' : '🌾 Seasonal'}
                            </span>
                        </div>
                        {crop.variety && <p className="text-sm text-gray-400 font-medium">{crop.variety}</p>}
                    </div>
                    <button onClick={() => onAction('history')}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
                        <span>📜</span> History
                    </button>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3 font-medium">
                    {crop.area_planted && <span>📐 {crop.area_planted} {crop.area_unit}</span>}
                    <span>📅 Planted: {crop.planting_date?.split('T')[0] || crop.planting_date}</span>
                </div>

                {/* Planting Material & Nursery Stock Box */}
                {(totalPlanted > 0 || nurseryStock > 0 || crop.planting_material) && (
                    <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-200/80 rounded-xl p-3 mb-3 space-y-1.5 shadow-2xs">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                                🌱 Planting Material
                            </span>
                            {crop.planting_material?.item_name && (
                                <span className="text-[11px] text-emerald-800 font-semibold truncate max-w-[150px]" title={crop.planting_material.item_name}>
                                    {crop.planting_material.item_name}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {totalPlanted > 0 && (
                                <span className="bg-white border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded-lg font-bold shadow-2xs">
                                    🌱 Sown / Sourced: {totalPlanted} {materialUnit}
                                </span>
                            )}
                            {nurseryStock > 0 ? (
                                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg font-bold shadow-2xs flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                                    🌿 Nursery Stock: {nurseryStock} {materialUnit}
                                </span>
                            ) : (
                                totalPlanted > 0 && (
                                    <span className="bg-emerald-100/50 text-emerald-700 px-2 py-0.5 rounded-lg text-[11px]">
                                        Nursery stock: 0
                                    </span>
                                )
                            )}
                            {Number(crop.total_seed_spent) > 0 && (
                                <span className="bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-lg font-medium">
                                    Cost: ₹{Number(crop.total_seed_spent).toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Inventory panel */}
                {Number(crop.total_harvested) > 0 ? (
                    <div className="bg-green-50/80 border border-green-200 rounded-xl p-3 mb-1">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-green-800 font-bold text-base">In Stock: {available}</span>
                            <div className="text-right text-xs text-green-600 font-medium">
                                <p>Harvested: {crop.total_harvested}</p>
                                <p>Sold: {crop.total_sold}</p>
                            </div>
                        </div>
                        {grades.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {grades.map(([grade, qty]) => (
                                    <span key={grade} className={`text-xs px-2 py-1 rounded-lg font-semibold ${grade === 'Unsegregated' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-white text-green-800 border border-green-200'}`}>
                                        {grade}: {qty}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 mb-1 italic">No harvests recorded yet.</p>
                )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 space-y-2">
                {/* Nursery stock gap filling button */}
                {nurseryStock > 0 && (
                    <button onClick={() => onAction('plantStock')}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5">
                        <span>🌱</span> Plant / Gap-Fill ({nurseryStock} in stock)
                    </button>
                )}

                <div className="flex gap-2">
                    <button onClick={() => onAction('buyMaterial')}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1">
                        <span>➕</span> Buy Seeds/Saplings
                    </button>
                    {hasUnsegregated && (
                        <button onClick={() => onAction('segregate')}
                            className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1">
                            <span>🗂️</span> Sort Grade
                        </button>
                    )}
                </div>

                <button onClick={() => onAction('harvest')}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-white rounded-xl font-bold text-base transition-all shadow-xs active:scale-95">
                    🌾 Record Harvest
                </button>
                {available > 0 && (
                    <button onClick={() => onAction('sell')}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-base transition-all shadow-xs active:scale-95">
                        💰 Sell Crop
                    </button>
                )}
                
                <button onClick={onArchive}
                    className="w-full py-1 text-gray-400 hover:text-gray-600 text-xs font-medium transition-all">
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
            {modal?.type === 'plantStock' && <PlantFromStockModal crop={modal.crop} onClose={() => setModal(null)} onSaved={load} />}
            {modal?.type === 'buyMaterial' && <BuyPlantingMaterialModal crop={modal.crop} onClose={() => setModal(null)} onSaved={load} />}
        </div>
    );
}
