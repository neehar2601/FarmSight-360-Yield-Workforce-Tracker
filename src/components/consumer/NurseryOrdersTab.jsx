import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function NurseryOrdersTab({ onExploreNursery }) {
    const user = mockStore.getCurrentUser();
    let orders = mockStore.getNurseryOrders({ customerId: user?.id });
    // In prototype, if current user has no nursery orders, show all nursery orders so tester can view
    if (orders.length === 0) {
        orders = mockStore.getNurseryOrders();
    }

    const [filter, setFilter] = useState('all'); // 'all' | 'pre_order' | 'ready' | 'completed'
    const [actionToast, setActionToast] = useState(null);

    const stages = [
        { key: 'booked', label: '1. Booked', icon: '📋' },
        { key: 'sown', label: '2. Sown', icon: '🌱' },
        { key: 'growing', label: '3. Growing', icon: '🌿' },
        { key: 'collected', label: '4. Hardened', icon: '☀️' },
        { key: 'processed', label: '5. Crated', icon: '📦' },
        { key: 'ready_available', label: '6. Ready', icon: '🎉' },
    ];

    const stageOrder = ['booked', 'sown', 'growing', 'collected', 'processed', 'ready_available', 'completed'];

    const getStageIndex = (stageKey) => {
        const idx = stageOrder.indexOf(stageKey);
        return idx >= 0 ? idx : 0;
    };

    const filteredOrders = orders.filter((o) => {
        if (filter === 'pre_order') return o.is_pre_order && o.status !== 'completed';
        if (filter === 'ready') return o.status === 'ready_for_pickup' || o.status === 'ready_for_dispatch';
        if (filter === 'completed') return o.status === 'completed';
        return true;
    });

    const handleSettleBalance = (orderId) => {
        const res = mockStore.settleNurseryBalancePayment(orderId);
        if (res.error) {
            alert(res.error);
        } else {
            setActionToast(`✓ 80% balance payment settled! Order #${res.data.order_number} is now 100% paid and Pickup PIN is active.`);
            setTimeout(() => setActionToast(null), 4000);
        }
    };

    const handleConfirmDeliveryReceived = (orderId) => {
        const res = mockStore.confirmNurseryDeliveryReception(orderId);
        if (res.error) {
            alert(res.error);
        } else {
            setActionToast(`✓ Nursery plants confirmed received! Order #${res.data.order_number} is completed.`);
            setTimeout(() => setActionToast(null), 4000);
        }
    };

    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-4 max-w-lg mx-auto shadow-sm">
                <span className="text-5xl block">🌱</span>
                <h3 className="font-extrabold text-gray-900 text-lg">No Nursery Orders Yet</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                    You haven't ordered seeds or booked pre-order seedling batches yet. Explore verified nursery partner listings to reserve upcoming propagation batches!
                </p>
                {onExploreNursery && (
                    <button
                        onClick={onExploreNursery}
                        className="px-5 py-2.5 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md"
                    >
                        Browse Nursery & Seeds &rarr;
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Action Toast */}
            {actionToast && (
                <div className="bg-emerald-700 text-white p-4 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-in slide-in-from-top-2">
                    <span>{actionToast}</span>
                    <button onClick={() => setActionToast(null)} className="text-white font-bold text-lg">&times;</button>
                </div>
            )}

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        All Orders ({orders.length})
                    </button>
                    <button
                        onClick={() => setFilter('pre_order')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                            filter === 'pre_order' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <span>🌱</span> Active Pre-Orders
                    </button>
                    <button
                        onClick={() => setFilter('ready')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                            filter === 'ready' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <span>🎉</span> Ready for Pickup/Dispatch
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            filter === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Completed
                    </button>
                </div>

                <div className="text-[11px] text-gray-500 font-medium">
                    Showing {filteredOrders.length} of {orders.length} orders
                </div>
            </div>

            {/* Orders Cards List */}
            <div className="space-y-6">
                {filteredOrders.map((order) => {
                    const currentIdx = getStageIndex(order.current_stage);
                    const isReady = order.current_stage === 'ready_available' || order.status === 'ready_for_pickup' || order.status === 'ready_for_dispatch';
                    const isCompleted = order.status === 'completed';
                    const needsBalance = order.is_pre_order && !order.is_balance_paid && isReady;

                    return (
                        <div
                            key={order.id}
                            className={`bg-white rounded-3xl border overflow-hidden shadow-sm transition-all ${
                                isReady && !isCompleted
                                    ? 'border-purple-300 ring-2 ring-purple-100 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {/* Card Top Banner */}
                            <div className="p-5 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono font-bold text-lime-400 text-xs">
                                            #{order.order_number}
                                        </span>
                                        <span className="text-gray-400 text-[10px]">&bull;</span>
                                        <span className="text-[11px] text-gray-300">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            order.is_pre_order
                                                ? 'bg-indigo-500/30 border border-indigo-400/40 text-indigo-300'
                                                : 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-300'
                                        }`}>
                                            {order.is_pre_order ? '🌱 Pre-Order Batch' : '⚡ Readily Available'}
                                        </span>
                                    </div>
                                    <h4 className="font-black text-white text-base">
                                        {order.title} <span className="text-gray-400 font-normal text-xs">({order.variety})</span>
                                    </h4>
                                </div>

                                {/* Right: Nursery name & status */}
                                <div className="sm:text-right space-y-1">
                                    <div className="text-xs text-lime-300 font-bold flex sm:justify-end items-center gap-1">
                                        <span>🏡</span>
                                        <span>{order.nursery_name}</span>
                                    </div>
                                    <div>
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            isCompleted
                                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                                                : isReady
                                                ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40 animate-pulse'
                                                : 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                                        }`}>
                                            {isCompleted
                                                ? '✓ Handover Completed'
                                                : isReady
                                                ? '🎉 Ready for Collection / Handover'
                                                : `Active: Stage ${currentIdx + 1}/6`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Body */}
                            <div className="p-5 sm:p-6 space-y-6">
                                {/* Order Summary Row */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                                    <div>
                                        <span className="text-gray-400 text-[10px] block font-bold uppercase">Quantity</span>
                                        <span className="font-extrabold text-gray-900 text-sm">{order.quantity} {order.unit}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-[10px] block font-bold uppercase">Unit Price</span>
                                        <span className="font-extrabold text-gray-900 text-sm">₹{order.unit_price}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-[10px] block font-bold uppercase">Total Order Value</span>
                                        <span className="font-extrabold text-gray-900 text-sm">₹{order.subtotal?.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-[10px] block font-bold uppercase">Fulfillment</span>
                                        <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1">
                                            {order.fulfillment_type === 'nursery_pickup' ? '🚜 Self Pickup' : '🚚 Nursery Delivery'}
                                        </span>
                                    </div>
                                </div>

                                {/* Milestone Advance & Balance Settlement Notice */}
                                {order.is_pre_order && (
                                    <div className={`p-4 rounded-2xl border space-y-3 ${
                                        needsBalance
                                            ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300'
                                            : 'bg-indigo-50/60 border-indigo-200'
                                    }`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <div className="font-black text-xs text-indigo-950 flex items-center gap-1.5">
                                                    <span>💳</span> 2-Phase Milestone Payment Status
                                                </div>
                                                <div className="text-[11px] text-indigo-800">
                                                    Advance Token: <strong className="text-emerald-700">₹{order.advance_amount?.toLocaleString()} (PAID ✓)</strong>
                                                    <span className="mx-2">&bull;</span>
                                                    Remaining Balance: <strong>₹{order.balance_amount?.toLocaleString()}</strong>
                                                </div>
                                            </div>

                                            {needsBalance ? (
                                                <button
                                                    onClick={() => handleSettleBalance(order.id)}
                                                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto"
                                                >
                                                    <span>💳</span>
                                                    <span>Pay Remaining 80% (₹{order.balance_amount?.toLocaleString()}) & Unlock PIN</span>
                                                </button>
                                            ) : (
                                                <div className="text-right">
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-xs border border-emerald-300 inline-block">
                                                        ✓ {order.is_balance_paid ? '100% Fully Settled' : '20% Deposit Locked'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {needsBalance && (
                                            <p className="text-[11px] text-purple-900 bg-white/70 p-2.5 rounded-xl border border-purple-200 leading-relaxed">
                                                🌱 Your seedlings have finished root hardening and are ready for handover at Sunrise Nursery! Complete the remaining balance payment to receive your 6-digit gate collection PIN.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* 6-Stage Visual Stepper (Pre-Orders) */}
                                {order.is_pre_order && (
                                    <div className="space-y-3 bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                                <span>🌱</span> Live Plant Growth & Propagation Pipeline
                                            </span>
                                            <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                                                Stage {currentIdx + 1} of 6: {stages[currentIdx]?.label || order.current_stage}
                                            </span>
                                        </div>

                                        {/* Stepper Track */}
                                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                                            {stages.map((st, idx) => {
                                                const isPast = idx < currentIdx;
                                                const isCurrent = idx === currentIdx;
                                                const isFuture = idx > currentIdx;

                                                return (
                                                    <div
                                                        key={st.key}
                                                        className={`p-2.5 rounded-xl border text-center transition-all ${
                                                            isCurrent
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                                                                : isPast
                                                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                                                : 'bg-white text-gray-400 border-gray-200 opacity-60'
                                                        }`}
                                                    >
                                                        <div className="text-base mb-1">
                                                            {isPast ? '✓' : st.icon}
                                                        </div>
                                                        <div className="font-black text-[10px] leading-tight">
                                                            {st.label}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Growth Broadcast Log from Nursery */}
                                        {order.stage_history && order.stage_history.length > 0 && (
                                            <div className="pt-3 border-t border-gray-200 space-y-1.5">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                    Nursery Broadcast Logs:
                                                </span>
                                                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                                    {order.stage_history.slice().reverse().map((entry, hIdx) => (
                                                        <div key={hIdx} className="bg-white p-2.5 rounded-xl border border-gray-200 text-[11px] flex items-start justify-between gap-3">
                                                            <div className="space-y-0.5">
                                                                <span className="font-bold text-gray-900 block">{entry.label}</span>
                                                                <span className="text-gray-600">{entry.note}</span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-mono shrink-0">
                                                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Fulfillment Details: PIN Handover vs Delivery Reception */}
                                <div className="bg-gray-900 text-white p-5 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                        <span className="font-bold text-xs text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                                            {order.fulfillment_type === 'nursery_pickup' ? '🚜 Direct Nursery Pickup' : '🚚 Nursery Freight Delivery'}
                                        </span>
                                        <span className="text-[11px] text-gray-400">
                                            {isCompleted ? 'Handover Complete' : isReady ? 'Action Required' : 'Awaiting Stage Readiness'}
                                        </span>
                                    </div>

                                    {order.fulfillment_type === 'nursery_pickup' ? (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="space-y-1 text-xs">
                                                <span className="text-gray-300 block">
                                                    Pickup Location: <strong>Sunrise Agro Nursery, Plot 14-18, Hoskote Agrotech Zone</strong>
                                                </span>
                                                <span className="text-gray-400 text-[11px] block">
                                                    Show the 6-digit pickup verification code to the nursery gatekeeper to take custody of your seedling trays.
                                                </span>
                                            </div>

                                            {/* Pickup PIN Box */}
                                            {order.pickup_code ? (
                                                <div className="bg-gray-800 border-2 border-dashed border-lime-400/80 rounded-2xl p-3 text-center min-w-[160px] self-start sm:self-auto">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                        Pickup Verification PIN
                                                    </span>
                                                    <span className="font-mono text-2xl font-black text-lime-400 tracking-widest block my-0.5">
                                                        {order.pickup_code.slice(0, 3)}-{order.pickup_code.slice(3)}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 block">
                                                        {isCompleted ? '✓ Verified by Nursery' : 'Present at Nursery Gate'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-800 rounded-xl p-3 text-center text-xs text-gray-400">
                                                    PIN will be revealed when ready
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Delivery Details */
                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                <div className="space-y-0.5">
                                                    <span className="text-gray-300 block">
                                                        Delivery Destination: <strong>{order.delivery_address?.street || 'Green Valley Orchards, Devanahalli'}</strong>
                                                    </span>
                                                    {order.delivery_details && (
                                                        <div className="text-[11px] text-gray-400 flex items-center gap-2 pt-1">
                                                            <span>Vehicle: <strong className="text-white">{order.delivery_details.vehicle_number}</strong></span>
                                                            <span>&bull;</span>
                                                            <span>Driver: <strong className="text-white">{order.delivery_details.driver_name}</strong></span>
                                                            <span>&bull;</span>
                                                            <span className="font-mono text-lime-400 font-bold">{order.delivery_details.tracking_number}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {order.status === 'dispatched' && (
                                                    <button
                                                        onClick={() => handleConfirmDeliveryReceived(order.id)}
                                                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
                                                    >
                                                        <span>✓</span>
                                                        <span>Confirm Received Nursery Delivery</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
