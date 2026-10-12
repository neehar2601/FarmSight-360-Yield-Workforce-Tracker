import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function NurseryBookingModal({ isOpen, onClose, listing, onOrderPlaced }) {
    if (!isOpen || !listing) return null;

    const user = mockStore.getCurrentUser();
    const isPreOrder = listing.availability_type === 'pre_order';

    const minQty = listing.min_order_qty || 1;
    const [quantity, setQuantity] = useState(minQty);
    const [fulfillmentType, setFulfillmentType] = useState(listing.pickup_available ? 'nursery_pickup' : 'nursery_delivery');
    const [deliveryAddress, setDeliveryAddress] = useState(user?.profile?.address?.street || 'Green Valley Orchards, Plot 42, Devanahalli');
    const [contactPhone, setContactPhone] = useState(user?.profile?.mobile_number || '+91 98765 43210');
    const [buyerNotes, setBuyerNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const unitPrice = parseFloat(listing.unit_price) || 0;
    const totalAmount = unitPrice * quantity;
    const advancePercentage = listing.advance_percentage || 20;
    const advanceAmount = isPreOrder ? Math.round((totalAmount * advancePercentage) / 100) : totalAmount;
    const balanceAmount = isPreOrder ? totalAmount - advanceAmount : 0;

    const stageLabels = {
        booked: '1. Advance Booked',
        sown: '2. Sown & Germinating',
        growing: '3. Growing in Polyhouse',
        collected: '4. Hardened under Sunlight',
        processed: '5. Graded & Crated',
        ready_available: '6. Ready for Handover',
    };

    const handleConfirmBooking = (e) => {
        e.preventDefault();
        setError('');

        if (quantity < minQty) {
            setError(`Minimum order quantity for this variety is ${minQty} ${listing.unit}.`);
            return;
        }

        setIsSubmitting(true);

        const orderData = {
            nursery_id: listing.nursery_id,
            nursery_name: listing.nursery_name,
            listing_id: listing.id,
            title: listing.title,
            variety: listing.variety,
            category: listing.category,
            quantity: Number(quantity),
            unit: listing.unit,
            unit_price: unitPrice,
            fulfillment_type: fulfillmentType,
            delivery_address: fulfillmentType === 'nursery_delivery' ? {
                street: deliveryAddress,
                city: 'Bengaluru',
                pincode: '562110',
            } : null,
            contact_phone: contactPhone,
            buyer_notes: buyerNotes,
            is_pre_order: isPreOrder,
            advance_percentage: isPreOrder ? advancePercentage : 100,
        };

        const res = mockStore.placeNurseryOrder(orderData);
        setIsSubmitting(false);

        if (res.error) {
            setError(res.error);
        } else {
            if (onOrderPlaced) onOrderPlaced(res.data);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 my-8">
                {/* Header Banner */}
                <div className={`p-6 text-white ${
                    isPreOrder
                        ? 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900'
                        : 'bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🌱</span>
                            <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-[11px] font-black uppercase tracking-wider">
                                {isPreOrder ? 'Milestone Pre-Order Batch' : 'Readily Available Stock'}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-lg"
                        >
                            &times;
                        </button>
                    </div>

                    <h3 className="text-xl font-black mt-3 leading-tight">{listing.title}</h3>
                    <p className="text-xs text-white/80 mt-1 flex items-center gap-2">
                        <span>Variety: <strong>{listing.variety}</strong></span>
                        <span>&bull;</span>
                        <span>Nursery: <strong>{listing.nursery_name}</strong></span>
                    </p>
                </div>

                <form onSubmit={handleConfirmBooking} className="p-6 space-y-5 text-xs text-gray-700">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Pre-Order Milestone Notice */}
                    {isPreOrder ? (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
                            <div className="flex items-center justify-between text-indigo-900 font-bold">
                                <span className="flex items-center gap-1.5">
                                    <span>🛡️</span> 2-Phase Milestone Guarantee
                                </span>
                                <span className="text-[11px] bg-indigo-200/80 px-2 py-0.5 rounded-full text-indigo-900 font-black">
                                    {advancePercentage}% Deposit Lock
                                </span>
                            </div>
                            <p className="text-[11px] text-indigo-800 leading-relaxed">
                                You only pay a <strong>{advancePercentage}% token deposit (₹{advanceAmount.toLocaleString()})</strong> today to lock your seedling tray reservation. The nursery will broadcast real-time germination and growth updates. You pay the remaining <strong>{100 - advancePercentage}% (₹{balanceAmount.toLocaleString()})</strong> only when the nursery marks the plants ready for collection!
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 text-[11px] text-indigo-900">
                                <span>Current Batch Stage:</span>
                                <span className="font-black text-indigo-950 bg-white px-2 py-0.5 rounded-md border border-indigo-300">
                                    {stageLabels[listing.current_stage] || listing.current_stage}
                                </span>
                            </div>
                            {listing.ready_by_date && (
                                <div className="flex items-center justify-between text-[11px] text-indigo-900">
                                    <span>Estimated Readiness:</span>
                                    <span className="font-bold text-indigo-950">{listing.ready_by_date}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="font-bold text-emerald-900 text-xs">⚡ Ready for Immediate Handover</div>
                                <div className="text-[11px] text-emerald-700">Available in stock for same-day nursery pickup or expedited nursery delivery.</div>
                            </div>
                            <span className="text-xl">✅</span>
                        </div>
                    )}

                    {/* Quantity & Unit Pricing */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-extrabold text-gray-900 text-xs block">Order Quantity</label>
                                <span className="text-[11px] text-gray-500">Unit: {listing.unit} (Min: {minQty})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
                                    className="w-8 h-8 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 font-bold text-sm flex items-center justify-center text-gray-800"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    min={minQty}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(minQty, parseInt(e.target.value) || minQty))}
                                    className="w-16 text-center font-black text-sm py-1 border border-gray-300 rounded-xl bg-white text-gray-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-8 h-8 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 font-bold text-sm flex items-center justify-center text-gray-800"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                            <span className="text-gray-500">Price per {listing.unit}:</span>
                            <span className="font-bold text-gray-900">₹{unitPrice.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Fulfillment Method Selection */}
                    <div className="space-y-2">
                        <label className="font-extrabold text-gray-900 block text-xs">Fulfillment & Handover Method</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                                fulfillmentType === 'nursery_pickup'
                                    ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-xs text-gray-900 flex items-center gap-1.5">
                                        <span>🚜</span> Self Nursery Pickup
                                    </span>
                                    <input
                                        type="radio"
                                        name="nursery_fulfillment"
                                        checked={fulfillmentType === 'nursery_pickup'}
                                        onChange={() => setFulfillmentType('nursery_pickup')}
                                        className="text-emerald-600"
                                    />
                                </div>
                                <span className="text-[10px] text-gray-500 leading-tight">
                                    Collect directly from Hoskote Nursery using secure 6-digit pickup PIN.
                                </span>
                                <span className="text-[11px] font-bold text-emerald-700 mt-1">FREE</span>
                            </label>

                            <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                                fulfillmentType === 'nursery_delivery'
                                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-xs text-gray-900 flex items-center gap-1.5">
                                        <span>🚚</span> Nursery Delivery
                                    </span>
                                    <input
                                        type="radio"
                                        name="nursery_fulfillment"
                                        checked={fulfillmentType === 'nursery_delivery'}
                                        onChange={() => setFulfillmentType('nursery_delivery')}
                                        className="text-blue-600"
                                    />
                                </div>
                                <span className="text-[10px] text-gray-500 leading-tight">
                                    Delivered via crated agricultural freight vehicle directly to your farm.
                                </span>
                                <span className="text-[11px] font-bold text-blue-700 mt-1">Free Nursery Logistics</span>
                            </label>
                        </div>
                    </div>

                    {/* Address / Contact */}
                    {fulfillmentType === 'nursery_delivery' && (
                        <div className="space-y-1.5">
                            <label className="font-bold text-gray-800 text-[11px]">Farm Delivery Address</label>
                            <input
                                type="text"
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                required
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                                placeholder="Plot number, village, landmark"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="font-bold text-gray-800 text-[11px]">Contact Mobile</label>
                            <input
                                type="text"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="font-bold text-gray-800 text-[11px]">Planting Notes (Optional)</label>
                            <input
                                type="text"
                                value={buyerNotes}
                                onChange={(e) => setBuyerNotes(e.target.value)}
                                placeholder="e.g. Need hardening by Oct end"
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-gray-900 text-white rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-300">
                            <span>Total Item Value ({quantity} {listing.unit}):</span>
                            <span className="font-bold text-white">₹{totalAmount.toLocaleString()}</span>
                        </div>

                        {isPreOrder ? (
                            <>
                                <div className="flex items-center justify-between text-xs text-indigo-300 font-bold border-t border-gray-800 pt-2">
                                    <span>Milestone Advance Deposit ({advancePercentage}%):</span>
                                    <span className="text-sm font-black text-lime-400">₹{advanceAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-gray-400">
                                    <span>Balance on Plant Readiness ({100 - advancePercentage}%):</span>
                                    <span>₹{balanceAmount.toLocaleString()}</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-between text-sm font-black text-white border-t border-gray-800 pt-2">
                                <span>Immediate Total:</span>
                                <span className="text-lime-400">₹{totalAmount.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
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
                            className={`flex-[2] py-3 text-white rounded-2xl font-black transition-all shadow-md active:scale-95 text-xs flex items-center justify-center gap-2 ${
                                isPreOrder
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/20'
                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                            }`}
                        >
                            <span>✓</span>
                            <span>
                                {isPreOrder
                                    ? `Pay 20% Deposit (₹${advanceAmount.toLocaleString()}) & Book Batch`
                                    : `Pay ₹${totalAmount.toLocaleString()} & Confirm Order`
                                }
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
