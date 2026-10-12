import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function NurseryPreOrderPipeline({ onSelectForStageUpdate }) {
    const nursery = mockStore.getCurrentNursery();
    const listings = mockStore.getNurseryListings({
        type: 'pre_order',
        nurseryId: nursery?.id,
    });
    const orders = mockStore.getNurseryOrders({
        nurseryId: nursery?.id,
    }).filter(o => o.is_pre_order);

    const [selectedTab, setSelectedTab] = useState('batches'); // 'batches' | 'orders'

    const stages = [
        { key: 'booked', label: '1. Booked', icon: '📋' },
        { key: 'sown', label: '2. Sown', icon: '🌱' },
        { key: 'growing', label: '3. Growing', icon: '🌿' },
        { key: 'collected', label: '4. Collected', icon: '☀️' },
        { key: 'processed', label: '5. Processed', icon: '📦' },
        { key: 'ready_available', label: '6. Ready for Delivery/Pickup', icon: '🎉' },
    ];

    const stageOrder = ['booked', 'sown', 'growing', 'collected', 'processed', 'ready_available', 'completed'];

    const getStageIndex = (stageKey) => {
        const idx = stageOrder.indexOf(stageKey);
        return idx >= 0 ? idx : 0;
    };

    return (
        <div className="space-y-6">
            {/* Header info */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur">
                        🌱 Pre-Order Propagation Pipeline
                    </span>
                    <h3 className="text-2xl font-black">Pre-Order Lifecycle & Growth Stage Broadcast</h3>
                    <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
                        Track seedling batches from precision sowing in mist chambers to sunlight hardening. Updating a batch stage instantly alerts all booked farmers with live growth logs.
                    </p>
                </div>

                {/* Sub-tab switcher */}
                <div className="bg-indigo-950/80 p-1.5 rounded-2xl flex items-center text-xs font-bold shrink-0 border border-indigo-700/50">
                    <button
                        onClick={() => setSelectedTab('batches')}
                        className={`px-4 py-2 rounded-xl transition-all ${
                            selectedTab === 'batches' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-300 hover:text-white'
                        }`}
                    >
                        Batches in Propagation ({listings.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab('orders')}
                        className={`px-4 py-2 rounded-xl transition-all ${
                            selectedTab === 'orders' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-300 hover:text-white'
                        }`}
                    >
                        Customer Bookings ({orders.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: BATCHES */}
            {selectedTab === 'batches' && (
                <div className="space-y-6">
                    {listings.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
                            <span className="text-4xl block">🌱</span>
                            <h4 className="font-bold text-gray-800 text-sm">No Active Pre-Order Batches</h4>
                            <p className="text-xs text-gray-500">
                                Switch to the Catalogue tab to list an upcoming seedling batch for farmer advance pre-orders.
                            </p>
                        </div>
                    ) : (
                        listings.map((batch) => {
                            const currentIdx = getStageIndex(batch.current_stage || 'sown');
                            const nextStage = stageOrder[currentIdx + 1];

                            return (
                                <div
                                    key={batch.id}
                                    className="bg-white rounded-3xl border border-gray-200 p-6 space-y-6 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={batch.image_url}
                                                alt={batch.title}
                                                className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-gray-900 text-base">{batch.title}</h4>
                                                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 rounded-lg text-[10px] font-black uppercase">
                                                        Pre-Order Batch
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Variety: <strong>{batch.variety || 'Commercial Hybrid'}</strong> &bull; Category: {batch.category}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right text-xs">
                                                <span className="text-gray-400 block text-[10px] uppercase font-bold">Target Readiness</span>
                                                <span className="font-black text-indigo-950 text-sm">
                                                    {batch.ready_by_date ? new Date(batch.ready_by_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'In 3 Weeks'}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => onSelectForStageUpdate(batch)}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 shrink-0"
                                            >
                                                <span>🔄</span> Update Growth Stage
                                            </button>
                                        </div>
                                    </div>

                                    {/* INTERACTIVE VISUAL STEPPER */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-700">6-Stage Nursery Growth Progress:</span>
                                            <span className="font-black text-indigo-700 uppercase tracking-wider text-[11px]">
                                                Stage {Math.min(6, currentIdx + 1)} of 6: {stages[currentIdx]?.label || batch.current_stage}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                            {stages.map((stg, idx) => {
                                                const isCompleted = idx < currentIdx;
                                                const isCurrent = idx === currentIdx;
                                                const isUpcoming = idx > currentIdx;

                                                return (
                                                    <div
                                                        key={stg.key}
                                                        onClick={() => {
                                                            mockStore.updateNurseryBatchStage(batch.id, {
                                                                stage: stg.key,
                                                                notes: `Stage updated to ${stg.label}.`,
                                                            });
                                                        }}
                                                        className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                                            isCurrent
                                                                ? 'border-indigo-600 bg-indigo-50/90 shadow-sm ring-2 ring-indigo-500/20'
                                                                : isCompleted
                                                                ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
                                                                : 'border-gray-200 bg-gray-50/50 text-gray-400 opacity-60 hover:opacity-100'
                                                        }`}
                                                        title={`Click to set stage to ${stg.label}`}
                                                    >
                                                        <span className="text-xl block mb-1">{stg.icon}</span>
                                                        <span className="font-black text-[11px] block leading-tight">
                                                            {stg.label.split(' ')[1]}
                                                        </span>
                                                        <span className="text-[9px] font-bold uppercase mt-0.5 block">
                                                            {isCurrent ? '● Active' : isCompleted ? '✓ Done' : 'Pending'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* STAGE HISTORY LOGS */}
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
                                        <span className="font-black text-gray-800 block text-[11px] uppercase tracking-wider">
                                            Recent Agronomic Broadcasts to Farmers ({batch.stage_history?.length || 0}):
                                        </span>
                                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                            {batch.stage_history && batch.stage_history.length > 0 ? (
                                                [...batch.stage_history].reverse().map((log, lidx) => (
                                                    <div key={lidx} className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-start justify-between gap-3">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-gray-900">{log.label}</span>
                                                                <span className="text-[10px] text-gray-400 font-normal">
                                                                    {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-gray-600">{log.note}</p>
                                                        </div>
                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold uppercase shrink-0">
                                                            Broadcasted
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[11px] text-gray-400 italic">No stage updates logged yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* BATCH CAPACITY & QUICK ADVANCE */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                                        <div className="flex items-center gap-4 text-[11px]">
                                            <span>Batch Capacity: <strong>{batch.batch_capacity || 500} {batch.unit}</strong></span>
                                            <span>Pre-Booked: <strong>{batch.pre_ordered_qty || 0} {batch.unit}</strong></span>
                                            <span>Available to Book: <strong className="text-emerald-700">{batch.available_batch_qty || 0} {batch.unit}</strong></span>
                                        </div>

                                        {nextStage && nextStage !== 'completed' && (
                                            <button
                                                onClick={() => {
                                                    mockStore.updateNurseryBatchStage(batch.id, {
                                                        stage: nextStage,
                                                        notes: `Batch automatically advanced to next growth stage: ${nextStage}.`,
                                                    });
                                                }}
                                                className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-end"
                                            >
                                                <span>Fast Advance to Next Stage &rarr;</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB 2: INDIVIDUAL CUSTOMER PRE-ORDERS */}
            {selectedTab === 'orders' && (
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
                            <span className="text-4xl block">📦</span>
                            <h4 className="font-bold text-gray-800 text-sm">No Customer Pre-Orders Yet</h4>
                            <p className="text-xs text-gray-500">
                                When farmers book upcoming sapling batches with advance deposits, their orders will appear here.
                            </p>
                        </div>
                    ) : (
                        orders.map((ord) => (
                            <div
                                key={ord.id}
                                className="bg-white rounded-3xl border border-gray-200 p-5 space-y-4 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-gray-900 text-sm">{ord.order_number}</span>
                                            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 rounded-md text-[10px] font-black uppercase">
                                                Advance Pre-Order
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                                ord.status === 'ready_for_pickup' || ord.status === 'ready_for_dispatch'
                                                    ? 'bg-purple-100 text-purple-900 animate-pulse'
                                                    : ord.status === 'completed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-amber-100 text-amber-900'
                                            }`}>
                                                {ord.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            Buyer: <strong>{ord.customer_name}</strong> ({ord.customer_phone}) &bull; Fulfillment: <strong>{ord.fulfillment_type === 'nursery_pickup' ? '🚜 Nursery Pickup' : '🚚 Nursery Delivery'}</strong>
                                        </p>
                                    </div>

                                    <div className="text-right text-xs">
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Order Value</span>
                                        <span className="text-lg font-black text-emerald-800">₹{ord.subtotal.toLocaleString()}</span>
                                        <span className="text-[10px] text-gray-500 block">
                                            20% Advance: ₹{ord.advance_amount.toLocaleString()} &bull; Balance: ₹{ord.balance_amount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Item summary */}
                                <div className="flex flex-wrap items-center justify-between text-xs bg-gray-50 p-3 rounded-2xl gap-3">
                                    <div>
                                        <span className="font-black text-gray-900">{ord.item_title}</span>
                                        <span className="text-gray-500 block text-[11px]">
                                            Quantity: <strong>{ord.quantity} {ord.unit}</strong> (@ ₹{ord.unit_price}/{ord.unit})
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-700">
                                            Current Stage: <strong className="text-indigo-800 uppercase">{ord.current_stage}</strong>
                                        </span>
                                        <button
                                            onClick={() => onSelectForStageUpdate(ord)}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                                        >
                                            Update Stage
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
