import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function B2BQuoteModal({ listing, isOpen, onClose, onRfqSubmitted, onRequireAuth, onViewQuotes }) {
    if (!isOpen || !listing) return null;

    const user = mockStore.getCurrentUser();
    const isB2B = user?.role === 'b2b_buyer';

    const [requestedQty, setRequestedQty] = useState(isB2B ? (listing.min_order_qty * 2 || 500) : 50);
    const [targetPrice, setTargetPrice] = useState(Math.round(listing.price_per_unit * 0.85));
    const [requiredDate, setRequiredDate] = useState('2025-09-05');
    const [deliveryLocation, setDeliveryLocation] = useState(
        user?.b2b_profile?.warehouse_address || user?.address?.street || 'Bengaluru Delivery Address'
    );
    const [notes, setNotes] = useState(
        isB2B
            ? 'Bulk procurement for retail store distribution. Ready for immediate payment upon inspection.'
            : 'Looking to purchase in bulk quantity. Inquiring for better costing/price per kg.'
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedRfq, setSubmittedRfq] = useState(null);

    // If not authenticated, enforce registration!
    if (!user || (user.role !== 'customer' && user.role !== 'b2b_buyer')) {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
                    <span className="text-4xl block">📦</span>
                    <h3 className="text-xl font-extrabold text-gray-900">Sign In to Request Bulk Quote</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        To request custom bulk quantity costing directly from the farmer, please sign in or register.
                    </p>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                onRequireAuth();
                            }}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md"
                        >
                            Sign In / Register &rarr;
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = mockStore.submitRfq({
            listing_id: listing.id,
            requested_qty: requestedQty,
            target_price_per_unit: targetPrice,
            required_by_date: requiredDate,
            delivery_location: deliveryLocation,
            buyer_notes: notes,
        });
        setIsSubmitting(false);
        if (res.data) {
            setSubmittedRfq(res.data);
            if (onRfqSubmitted) onRfqSubmitted(res.data);
        }
    };

    const handleSwitchToFarmer = () => {
        onClose();
        mockStore.setActiveRole('farmer');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                            🏢
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold text-gray-900">Request Custom Wholesale Quote</h3>
                            <p className="text-xs text-gray-500">{listing.title} &bull; {listing.farm_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
                        &times;
                    </button>
                </div>

                {submittedRfq ? (
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 text-3xl flex items-center justify-center mx-auto">
                            ✓
                        </div>
                        <h4 className="text-xl font-black text-gray-900">RFQ Submitted to Farmer!</h4>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            Proposal <strong>#{submittedRfq.rfq_number}</strong> for {submittedRfq.requested_qty} {submittedRfq.unit} at ₹{submittedRfq.target_price_per_unit}/{submittedRfq.unit} was delivered to <strong>{submittedRfq.farmer_name}</strong>.
                        </p>

                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-950 text-left space-y-2">
                            <span className="font-extrabold block">💡 Interactive Demo Shortcut:</span>
                            <p className="text-[11px] text-indigo-800">
                                Switch to the Farmer Portal right now to review this RFQ, send a counter-offer, or accept the deal!
                            </p>
                            <button
                                onClick={handleSwitchToFarmer}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                            >
                                <span>👨‍🌾</span> Switch to Farmer App to Counter/Accept Deal &rarr;
                            </button>
                        </div>

                        <div className="flex gap-2 justify-center pt-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                            >
                                Done
                            </button>
                            {onViewQuotes && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onViewQuotes();
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                                >
                                    💬 View My Quotes & Deals &rarr;
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex justify-between items-center text-indigo-950">
                            <div>
                                <span className="text-[10px] text-indigo-700 uppercase font-bold block">Current Base Price</span>
                                <span className="font-black text-base">₹{listing.price_per_unit.toLocaleString()} /{listing.unit}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-indigo-700 uppercase font-bold block">Minimum Order Qty</span>
                                <span className="font-bold">{listing.min_order_qty} {listing.unit}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Requested Volume ({listing.unit})</label>
                                <input
                                    type="number"
                                    required
                                    min={listing.min_order_qty}
                                    value={requestedQty}
                                    onChange={(e) => setRequestedQty(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-black text-gray-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Target Price (₹/{listing.unit})</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-black text-indigo-800 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Destination Warehouse</label>
                            <input
                                type="text"
                                required
                                value={deliveryLocation}
                                onChange={(e) => setDeliveryLocation(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>

                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Required Delivery Date</label>
                            <input
                                type="date"
                                required
                                value={requiredDate}
                                onChange={(e) => setRequiredDate(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>

                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Commercial Terms / Specifications</label>
                            <textarea
                                rows="2"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center text-xs font-bold">
                            <span className="text-gray-600">Total Proposed Contract Value:</span>
                            <span className="text-base font-black text-indigo-900">
                                ₹{(requestedQty * targetPrice).toLocaleString()}
                            </span>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Wholesale Proposal →'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
