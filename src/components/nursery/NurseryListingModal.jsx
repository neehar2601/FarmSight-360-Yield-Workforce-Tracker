import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function NurseryListingModal({ isOpen, onClose, onListingCreated, editListing = null }) {
    if (!isOpen) return null;

    const nursery = mockStore.getCurrentNursery();

    const [title, setTitle] = useState(editListing?.title || '');
    const [variety, setVariety] = useState(editListing?.variety || '');
    const [category, setCategory] = useState(editListing?.category || 'Vegetable Seedlings');
    const [availabilityType, setAvailabilityType] = useState(editListing?.availability_type || 'in_stock'); // 'in_stock' | 'pre_order'
    const [unit, setUnit] = useState(editListing?.unit || 'Tray (98 Seedlings)');
    const [unitPrice, setUnitPrice] = useState(editListing?.unit_price || '');
    const [stockQty, setStockQty] = useState(editListing?.stock_qty || '50');
    const [batchCapacity, setBatchCapacity] = useState(editListing?.batch_capacity || '500');
    const [minOrderQty, setMinOrderQty] = useState(editListing?.min_order_qty || (availabilityType === 'pre_order' ? '5' : '1'));
    const [advancePercentage, setAdvancePercentage] = useState(editListing?.advance_percentage || '20');
    const [readyByDate, setReadyByDate] = useState(editListing?.ready_by_date || '');
    const [currentStage, setCurrentStage] = useState(editListing?.current_stage || 'sown');
    const [stageNote, setStageNote] = useState('');
    const [imageUrl, setImageUrl] = useState(editListing?.image_url || 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=500&auto=format&fit=crop&q=80');
    const [description, setDescription] = useState(editListing?.description || '');
    const [seedlingAge, setSeedlingAge] = useState(editListing?.specs?.seedling_age || '25-Day Poly Plug');
    const [germinationRate, setGerminationRate] = useState(editListing?.specs?.germination_rate || '98%');
    const [diseaseResistance, setDiseaseResistance] = useState(editListing?.specs?.disease_resistance || '');

    const [reservedForFarm, setReservedForFarm] = useState(editListing?.reserved_for_farm !== undefined ? editListing.reserved_for_farm.toString() : '30');
    const [linkToFarmInventory, setLinkToFarmInventory] = useState(true);

    const [pickupAvailable, setPickupAvailable] = useState(editListing?.pickup_available !== false);
    const [deliveryAvailable, setDeliveryAvailable] = useState(editListing?.delivery_available !== false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Please enter plant or seed title.');
            return;
        }
        if (!unitPrice || parseFloat(unitPrice) <= 0) {
            setError('Please enter a valid price per unit.');
            return;
        }

        const payload = {
            title: title.trim(),
            variety: variety.trim(),
            category,
            availability_type: availabilityType,
            unit,
            unit_price: parseFloat(unitPrice),
            stock_qty: availabilityType === 'in_stock' ? parseFloat(stockQty) : 0,
            batch_capacity: availabilityType === 'pre_order' ? parseFloat(batchCapacity) : null,
            reserved_for_farm: linkToFarmInventory ? (parseFloat(reservedForFarm) || 0) : 0,
            link_to_farm_inventory: linkToFarmInventory,
            farm_id: editListing?.farm_id || 'farm-1',
            min_order_qty: parseFloat(minOrderQty) || 1,
            advance_percentage: parseFloat(advancePercentage) || 20,
            ready_by_date: availabilityType === 'pre_order' ? (readyByDate || new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0]) : null,
            current_stage: availabilityType === 'pre_order' ? currentStage : null,
            stage_note: stageNote.trim() || undefined,
            pickup_available: pickupAvailable,
            delivery_available: deliveryAvailable,
            image_url: imageUrl.trim(),
            description: description.trim(),
            specs: {
                seedling_age: seedlingAge.trim(),
                germination_rate: germinationRate.trim(),
                disease_resistance: diseaseResistance.trim(),
            },
        };

        if (editListing) {
            mockStore.updateNurseryListing(editListing.id, payload);
        } else {
            mockStore.createNurseryListing(payload);
        }

        if (onListingCreated) onListingCreated();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto border border-gray-100">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold">
                            🌱
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">
                                {editListing ? 'Edit Nursery Listing' : 'List Plants or Seeds for Sale'}
                            </h3>
                            <p className="text-xs text-gray-500">
                                Nursery: <strong className="text-emerald-700">{nursery?.name || 'Your Nursery'}</strong> ({nursery?.license_number || 'NHB Certified'})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
                    >
                        &times;
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* AVAILABILITY MODE SELECTOR */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                            Availability State:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setAvailabilityType('in_stock');
                                    setMinOrderQty('1');
                                }}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                    availabilityType === 'in_stock'
                                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                                        <span>⚡</span> Readily Available (In-Stock)
                                    </span>
                                    <span className="text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                                        Instant Sale
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-600 leading-snug">
                                    Seedlings or seed packets already grown, hardened, and ready for immediate gate pickup or doorstep delivery.
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setAvailabilityType('pre_order');
                                    setMinOrderQty('5');
                                }}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                    availabilityType === 'pre_order'
                                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm ring-2 ring-indigo-500/20'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                                        <span>📅</span> Pre-Order (Advance Booking)
                                    </span>
                                    <span className="text-[10px] font-black uppercase bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded">
                                        Batch Booking
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-600 leading-snug">
                                    Farmers pre-book upcoming batches with a 20% advance deposit. Nursery updates growing stages until ready.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* BASIC INFO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Plant / Seed Offering Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Arka Rakshak F1 Hybrid Tomato Seedlings"
                                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Variety / Hybrid / Lineage</label>
                            <input
                                type="text"
                                value={variety}
                                onChange={(e) => setVariety(e.target.value)}
                                placeholder="e.g. IIHR Arka Rakshak (ToLCV Resistant)"
                                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold bg-white focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="Vegetable Seedlings">Vegetable Seedlings</option>
                                <option value="Fruit Plants / Grafts">Fruit Plants / Grafts</option>
                                <option value="Certified Seeds">Certified Seeds</option>
                                <option value="Commercial Timber / Plantation">Commercial Timber / Plantation</option>
                                <option value="Flowers & Ornamentals">Flowers & Ornamentals</option>
                                <option value="Herbs & Spices">Herbs & Spices</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Packaging Unit</label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-semibold bg-white focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="Tray (98 Seedlings)">Tray (98 Seedlings)</option>
                                <option value="Tray (104 Seedlings)">Tray (104 Seedlings)</option>
                                <option value="Grafted Plant (Polybag)">Grafted Plant (Polybag)</option>
                                <option value="Seedling Plug">Seedling Plug (Individual)</option>
                                <option value="Pack (100g Sealed Foil)">Pack (100g Sealed Foil)</option>
                                <option value="Pack (500g Certified Seeds)">Pack (500g Certified Seeds)</option>
                                <option value="Sapling (Bare Root)">Sapling (Bare Root)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Price (₹ per unit) *</label>
                            <input
                                type="number"
                                min="1"
                                step="any"
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(e.target.value)}
                                placeholder="e.g. 350"
                                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-black text-emerald-800 focus:border-emerald-500 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* DYNAMIC FIELDS: IN-STOCK VS PRE-ORDER */}
                    {availabilityType === 'in_stock' ? (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                                <span>📦</span> Readily Available Inventory Settings
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-700">Available Stock Quantity ({unit})</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={stockQty}
                                        onChange={(e) => setStockQty(e.target.value)}
                                        placeholder="e.g. 120"
                                        className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-700">Minimum Order Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={minOrderQty}
                                        onChange={(e) => setMinOrderQty(e.target.value)}
                                        placeholder="1"
                                        className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-black text-indigo-950">
                                    <span>📅</span> Pre-Order Batch & Milestone Settings
                                </div>
                                <span className="text-[10px] font-extrabold uppercase bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded">
                                    {advancePercentage}% Deposit Required
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-700">Total Batch Capacity ({unit})</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={batchCapacity}
                                        onChange={(e) => setBatchCapacity(e.target.value)}
                                        placeholder="e.g. 500"
                                        className="w-full p-2 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-700">Minimum Pre-Order Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={minOrderQty}
                                        onChange={(e) => setMinOrderQty(e.target.value)}
                                        placeholder="e.g. 5"
                                        className="w-full p-2 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-700">Target Ready-by Date</label>
                                    <input
                                        type="date"
                                        value={readyByDate}
                                        onChange={(e) => setReadyByDate(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-700">Starting Lifecycle Stage</label>
                                    <select
                                        value={currentStage}
                                        onChange={(e) => setCurrentStage(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                                    >
                                        <option value="booked">1. Booked (Seeds Procured / Tray Reserved)</option>
                                        <option value="sown">2. Sown (Sown in Pro-Trays / Mist Chamber)</option>
                                        <option value="growing">3. Growing (Vegetative Growth in Polyhouse)</option>
                                        <option value="collected">4. Collected (Hardened under Sunlight)</option>
                                        <option value="processed">5. Processed (Root-Balled & Quality Crated)</option>
                                        <option value="ready_available">6. Ready for Collection / Delivery</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-700">Initial Batch Note / Growth Update</label>
                                    <input
                                        type="text"
                                        value={stageNote}
                                        onChange={(e) => setStageNote(e.target.value)}
                                        placeholder="e.g. Sown in sterilized cocopeat, 98% germination guarantee."
                                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UNIFIED FARM INVENTORY ALLOCATION (OPTION A + C) */}
                    <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🏡</span>
                                <div>
                                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                                        Unified Farm Inventory Allocation
                                    </h4>
                                    <p className="text-[11px] text-emerald-800">
                                        Farmer & Nursery Unified Pool: Split stock between your own farm plots vs nursery market.
                                    </p>
                                </div>
                            </div>
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-900">
                                <input
                                    type="checkbox"
                                    checked={linkToFarmInventory}
                                    onChange={(e) => setLinkToFarmInventory(e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                />
                                <span>Sync with Farm Inventory</span>
                            </label>
                        </div>

                        {linkToFarmInventory && (
                            <div className="space-y-3 pt-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-gray-700">
                                            Reserved for Own Farm Plots ({unit})
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={reservedForFarm}
                                            onChange={(e) => setReservedForFarm(e.target.value)}
                                            placeholder="e.g. 40"
                                            className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-bold bg-white"
                                        />
                                        <p className="text-[10px] text-gray-500">
                                            Protected pool: used for field transplanting, never sold to outside buyers.
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-gray-700">
                                            Marketplace Sale Quota ({unit})
                                        </label>
                                        <div className="p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900">
                                            {availabilityType === 'in_stock' ? (parseFloat(stockQty) || 0) : (parseFloat(batchCapacity) || 0)} {unit}
                                        </div>
                                        <p className="text-[10px] text-gray-500">
                                            {availabilityType === 'in_stock' ? 'In-stock quantity available for immediate orders.' : 'Batch booking capacity for pre-orders.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Summary Pill */}
                                <div className="p-2.5 bg-emerald-100/70 border border-emerald-300/80 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-emerald-900 font-semibold text-[11px]">
                                        <strong>Total Propagation Volume:</strong> {(parseFloat(reservedForFarm) || 0) + (availabilityType === 'in_stock' ? (parseFloat(stockQty) || 0) : (parseFloat(batchCapacity) || 0))} {unit}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md shadow-xs">
                                        🔒 Two-Way Real-Time Synced
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SPECS & HORTICULTURE DETAILS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Seedling Age / Spec</label>
                            <input
                                type="text"
                                value={seedlingAge}
                                onChange={(e) => setSeedlingAge(e.target.value)}
                                placeholder="e.g. 25-Day Plug"
                                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Germination Vigor</label>
                            <input
                                type="text"
                                value={germinationRate}
                                onChange={(e) => setGerminationRate(e.target.value)}
                                placeholder="e.g. 98%"
                                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-700">Disease Resistances</label>
                            <input
                                type="text"
                                value={diseaseResistance}
                                onChange={(e) => setDiseaseResistance(e.target.value)}
                                placeholder="e.g. ToLCV, Bacterial Wilt"
                                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium"
                            />
                        </div>
                    </div>

                    {/* FULFILLMENT CHOICES */}
                    <div className="flex flex-wrap gap-6 pt-1 text-xs">
                        <label className="flex items-center gap-2 font-bold text-gray-800 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={pickupAvailable}
                                onChange={(e) => setPickupAvailable(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            <span>🚜 Nursery Gate Pickup (Free)</span>
                        </label>

                        <label className="flex items-center gap-2 font-bold text-gray-800 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={deliveryAvailable}
                                onChange={(e) => setDeliveryAvailable(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            <span>🚚 Nursery Delivery to Farm</span>
                        </label>
                    </div>

                    {/* IMAGE & DESCRIPTION */}
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">Plant / Batch Photo URL</label>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-mono"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">Cultivation Notes / Agronomic Description</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe seedling health, ideal planting season, expected yield, and polyhouse care details..."
                            className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
                        />
                    </div>

                    {/* BUTTONS */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                        >
                            <span>✓</span> {editListing ? 'Save Changes' : 'Publish to Nursery Store'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
