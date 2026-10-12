import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function NurseryAllocationModal({ isOpen, onClose, item, onSynced }) {
    if (!isOpen || !item) return null;

    const totalQty = parseFloat(item.quantity) || 0;
    const initialReserved = item.reserved_for_farm !== undefined ? item.reserved_for_farm : Math.floor(totalQty * 0.4);
    const initialAllocated = item.allocated_for_sale !== undefined ? item.allocated_for_sale : Math.max(0, totalQty - initialReserved);

    const [reservedForFarm, setReservedForFarm] = useState(initialReserved);
    const [allocatedForSale, setAllocatedForSale] = useState(initialAllocated);
    const [sellingPrice, setSellingPrice] = useState(item.selling_price || 320);
    const [availabilityType, setAvailabilityType] = useState(item.availability_type || 'in_stock');
    const [currentStage, setCurrentStage] = useState(item.current_stage || (availabilityType === 'pre_order' ? 'growing' : 'ready_available'));
    const [readyByDate, setReadyByDate] = useState(item.ready_by_date || '2026-11-05');
    const [isMarketplaceListed, setIsMarketplaceListed] = useState(item.is_marketplace_listed !== false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const soldQty = item.sold_quantity || 0;
    const availableForSale = Math.max(0, allocatedForSale - soldQty);

    const handleTotalChange = (reserved, allocated) => {
        setReservedForFarm(reserved);
        setAllocatedForSale(allocated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (allocatedForSale < soldQty) {
            setError(`Cannot reduce allocated sale quota below ${soldQty} ${item.unit} because customers have already booked them!`);
            return;
        }

        setIsSubmitting(true);
        const res = mockStore.syncInventoryWithNurseryListing(item.id, {
            allocated_for_sale: Number(allocatedForSale),
            reserved_for_farm: Number(reservedForFarm),
            selling_price: Number(sellingPrice),
            availability_type: availabilityType,
            current_stage: currentStage,
            ready_by_date: readyByDate,
            is_marketplace_listed: isMarketplaceListed,
        });

        setIsSubmitting(false);
        if (res.error) {
            setError(res.error);
        } else {
            if (onSynced) onSynced(res.data);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 my-8">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-lime-950 text-white p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🌱</span>
                            <span className="px-2.5 py-1 bg-lime-400/20 border border-lime-300/30 text-lime-300 rounded-full text-[11px] font-black uppercase tracking-wider">
                                Unified Nursery Inventory Allocation
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-lg"
                        >
                            &times;
                        </button>
                    </div>

                    <h3 className="text-xl font-black mt-3 leading-tight">{item.name}</h3>
                    <p className="text-xs text-lime-100/80 mt-1">
                        Category: <strong>{item.category_name}</strong> &bull; Total on Hand: <strong>{totalQty} {item.unit}</strong>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-gray-700">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Stock Allocation Splitter */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
                                ⚖️ Stock Quota Allocation ({totalQty} {item.unit} Total)
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                                Split between Farm Use and Public Nursery Sale
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Reserved for own farm */}
                            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 space-y-1.5">
                                <label className="font-black text-emerald-950 text-xs block flex items-center gap-1.5">
                                    <span>🏡</span> Reserved for Own Farm
                                </label>
                                <span className="text-[10px] text-emerald-700 block leading-tight">
                                    Protected for planting on your own plots (Crops page). Hidden from market.
                                </span>
                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="number"
                                        min="0"
                                        value={reservedForFarm}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                                            handleTotalChange(val, Math.max(0, totalQty - val));
                                        }}
                                        className="w-full p-2 bg-white border border-emerald-400 rounded-xl font-black text-sm text-emerald-950 text-center"
                                    />
                                    <span className="text-emerald-900 font-bold shrink-0">{item.unit.split(' ')[0]}</span>
                                </div>
                            </div>

                            {/* Allocated for sale */}
                            <div className="bg-indigo-50 border border-indigo-300 rounded-2xl p-3.5 space-y-1.5">
                                <label className="font-black text-indigo-950 text-xs block flex items-center gap-1.5">
                                    <span>🛒</span> Nursery Market Quota
                                </label>
                                <span className="text-[10px] text-indigo-700 block leading-tight">
                                    Available for other farmers and buyers on the Nursery Marketplace.
                                </span>
                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="number"
                                        min={soldQty}
                                        value={allocatedForSale}
                                        onChange={(e) => {
                                            const val = Math.max(soldQty, parseFloat(e.target.value) || 0);
                                            handleTotalChange(Math.max(0, totalQty - val), val);
                                        }}
                                        className="w-full p-2 bg-white border border-indigo-400 rounded-xl font-black text-sm text-indigo-950 text-center"
                                    />
                                    <span className="text-indigo-900 font-bold shrink-0">{item.unit.split(' ')[0]}</span>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown status pill */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 text-center text-[11px]">
                            <div className="bg-white p-2 rounded-xl border border-gray-200">
                                <span className="text-gray-400 block text-[10px]">Own Farm Pool</span>
                                <span className="font-black text-emerald-700">{reservedForFarm} {item.unit.split(' ')[0]}</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-gray-200">
                                <span className="text-gray-400 block text-[10px]">Pre-Ordered / Sold</span>
                                <span className="font-black text-amber-700">{soldQty} {item.unit.split(' ')[0]}</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-gray-200">
                                <span className="text-gray-400 block text-[10px]">Live Unsold Buffer</span>
                                <span className="font-black text-indigo-700">{availableForSale} {item.unit.split(' ')[0]}</span>
                            </div>
                        </div>
                    </div>

                    {/* Commercial Marketplace Terms */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="font-extrabold text-gray-900 text-xs">Public Marketplace Pricing & Fulfillment</label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isMarketplaceListed}
                                    onChange={(e) => setIsMarketplaceListed(e.target.checked)}
                                    className="rounded text-lime-600 focus:ring-lime-500 w-4 h-4"
                                />
                                <span className="font-black text-xs text-gray-800">Publish Live to Nursery Market</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="font-bold text-gray-700 text-[11px]">Selling Price (₹ per {item.unit})</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={sellingPrice}
                                        onChange={(e) => setSellingPrice(e.target.value)}
                                        className="w-full pl-8 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-lime-500"
                                    />
                                </div>
                                <span className="text-[10px] text-gray-400 block">Cost price: ₹{item.cost_price || 0}</span>
                            </div>

                            <div className="space-y-1">
                                <label className="font-bold text-gray-700 text-[11px]">Availability Mode</label>
                                <select
                                    value={availabilityType}
                                    onChange={(e) => setAvailabilityType(e.target.value)}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-lime-500"
                                >
                                    <option value="in_stock">⚡ Readily Available (In-Stock)</option>
                                    <option value="pre_order">🌱 Advance Pre-Order (20% Milestone)</option>
                                </select>
                            </div>
                        </div>

                        {/* Pre-order specific fields */}
                        {availabilityType === 'pre_order' && (
                            <div className="grid grid-cols-2 gap-3 bg-indigo-50/60 p-3 rounded-2xl border border-indigo-200">
                                <div className="space-y-1">
                                    <label className="font-bold text-indigo-900 text-[11px]">Current Growth Stage</label>
                                    <select
                                        value={currentStage}
                                        onChange={(e) => setCurrentStage(e.target.value)}
                                        className="w-full p-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-indigo-950 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="booked">1. Booked (Seeds Procured)</option>
                                        <option value="sown">2. Sown (Mist Chamber Germination)</option>
                                        <option value="growing">3. Growing in Polyhouse</option>
                                        <option value="collected">4. Collected & Hardened</option>
                                        <option value="processed">5. Processed & Root-Balled</option>
                                        <option value="ready_available">6. Ready for Collection</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-indigo-900 text-[11px]">Target Handover Date</label>
                                    <input
                                        type="date"
                                        value={readyByDate}
                                        onChange={(e) => setReadyByDate(e.target.value)}
                                        className="w-full p-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-indigo-950 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold transition-all text-xs"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-3 bg-gradient-to-r from-lime-600 to-emerald-700 hover:from-lime-500 hover:to-emerald-600 text-white font-black rounded-2xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>✓</span>
                            <span>Save & Sync with Nursery Marketplace</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
