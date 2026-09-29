import React from 'react';
import { mockStore } from '../../mock/mockStore';

export default function OrderSuccessModal({ order, isOpen, onClose, onViewOrders }) {
    if (!isOpen || !order) return null;

    const isPickup = order.fulfillment_type === 'farm_pickup';

    const handleSwitchToFarmer = () => {
        onClose();
        mockStore.setActiveRole('farmer');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center animate-in zoom-in-95">
                <div className={`w-16 h-16 rounded-full text-3xl flex items-center justify-center mx-auto ${
                    order.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 animate-pulse'
                }`}>
                    {order.is_approved ? '✓' : '⏳'}
                </div>

                <div>
                    <h3 className="text-2xl font-black text-gray-900">
                        {order.is_approved ? 'Order Confirmed!' : 'Order Placed (Pending Approval)'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Order #{order.order_number}</p>
                </div>

                {/* APPROVAL STATUS BANNER */}
                {!order.is_approved ? (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 text-center space-y-3">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-900 block">
                            ⏳ Routed for Farmer Acceptance
                        </span>
                        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-1">
                            <span className="text-2xl block">🔒</span>
                            <span className="text-base font-black text-amber-900 block font-mono tracking-widest">
                                • • • - • • •
                            </span>
                            <span className="text-xs font-bold text-amber-800 block">
                                {isPickup ? 'Pickup PIN' : 'Courier Delivery Code'} Locked
                            </span>
                            <p className="text-[11px] text-gray-600 leading-relaxed pt-1">
                                Your order has been submitted to <strong>{order.farm_name || order.items[0]?.farm_name}</strong>. As soon as the farmer reviews and approves the harvest request, your 6-digit code will unlock here and under <strong>My Orders</strong>!
                            </p>
                        </div>

                        {/* Interactive Prototype Shortcut */}
                        <div className="pt-2 border-t border-amber-200/70">
                            <button
                                onClick={handleSwitchToFarmer}
                                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                            >
                                <span>👨‍🌾</span> Switch to Farmer Dashboard to Approve Order &rarr;
                            </button>
                        </div>
                    </div>
                ) : (
                    /* HIGHLIGHT: 6-DIGIT VERIFICATION CODE WHEN APPROVED */
                    isPickup ? (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-5 shadow-inner space-y-3">
                            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-900 block">
                                🚜 Verified Farm Pickup Pass
                            </span>

                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Your 6-Digit Pickup PIN</span>
                                <span className="text-4xl font-black text-amber-700 tracking-widest font-mono block my-1">
                                    {order.pickup_code || order.pickup_details?.pickup_code}
                                </span>
                                <span className="text-[11px] text-gray-600">
                                    Show this PIN to the farmer at the farm gate upon arrival.
                                </span>
                            </div>

                            <div className="text-left text-xs text-amber-950 space-y-1 pt-1">
                                <div className="flex items-start gap-1">
                                    <span>📍</span>
                                    <span><strong>Location:</strong> {order.pickup_details?.location || 'Farm Gate'}</span>
                                </div>
                                <div className="flex items-start gap-1">
                                    <span>⏰</span>
                                    <span><strong>Slot:</strong> {order.pickup_details?.slot || 'Tomorrow'}</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-amber-200/70">
                                <button
                                    onClick={handleSwitchToFarmer}
                                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1"
                                >
                                    <span>👨‍🌾</span> Switch to Farmer App to Verify this PIN Now &rarr;
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-3xl p-5 shadow-inner space-y-3">
                            <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-900 block">
                                🚚 Direct Courier Delivery Approved
                            </span>

                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-200">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Courier Receipt Confirmation PIN</span>
                                <span className="text-4xl font-black text-purple-700 tracking-widest font-mono block my-1">
                                    {order.delivery_code || order.pickup_code || '519-823'}
                                </span>
                                <span className="text-[11px] text-gray-600">
                                    Share this PIN with the courier agent or enter it online to confirm receipt and release escrow.
                                </span>
                            </div>

                            <div className="text-left text-xs text-purple-950 space-y-1 pt-1">
                                <div className="flex items-start gap-1">
                                    <span>🏠</span>
                                    <span><strong>Delivery Address:</strong> {order.shipping_address?.street || 'Your Registered Address'}</span>
                                </div>
                            </div>
                        </div>
                    )
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                    >
                        Continue Shopping
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            onViewOrders();
                        }}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md"
                    >
                        Track Order Timeline &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
}
