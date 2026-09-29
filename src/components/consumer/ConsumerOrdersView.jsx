import React, { useState, useEffect } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function ConsumerOrdersView({ onBackToShopping, initialTab = 'orders' }) {
    const [, setTick] = useState(0);
    useEffect(() => {
        const unsub = mockStore.subscribe(() => setTick(t => t + 1));
        return unsub;
    }, []);

    const user = mockStore.getCurrentUser();
    const orders = mockStore.getOrders({ customerId: user?.id });
    const rfqs = mockStore.getRfqs({ buyerId: user?.id });

    const [activeTab, setActiveTab] = useState(initialTab); // 'orders' | 'quotes'
    const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || null);
    const [selectedRfqId, setSelectedRfqId] = useState(rfqs[0]?.id || null);

    // RFQ Negotiation State
    const [isCountering, setIsCountering] = useState(false);
    const [counterPriceInput, setCounterPriceInput] = useState('');
    const [counterMessageInput, setCounterMessageInput] = useState('');
    const [actionToast, setActionToast] = useState(null);

    // B2B Wholesale Reception State
    const [isB2BInwardOpen, setIsB2BInwardOpen] = useState(false);
    const [inwardInspectorName, setInwardInspectorName] = useState('');
    const [inwardGatePass, setInwardGatePass] = useState('');
    const [inwardRemarks, setInwardRemarks] = useState('');

    // Sync tab when prop changes
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    // Keep selected IDs valid
    const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0] || null;
    const selectedRfq = rfqs.find(r => r.id === selectedRfqId) || rfqs[0] || null;

    const pendingCountersCount = rfqs.filter(r => r.status === 'counter_offered').length;

    // Handlers for RFQ Actions
    const handleAcceptCounter = (rfq) => {
        const lastOffer = rfq.history?.[rfq.history.length - 1];
        const agreedPrice = lastOffer ? lastOffer.price : rfq.target_price_per_unit;
        const res = mockStore.acceptRfq(rfq.id, 'buyer');
        if (res.data?.order) {
            setActionToast(`✓ Counter offer accepted at ₹${agreedPrice}/${rfq.unit}! B2B Order #${res.data.order.order_number} created.`);
            setSelectedOrderId(res.data.order.id);
            setTimeout(() => {
                setActiveTab('orders');
                setActionToast(null);
            }, 1200);
        }
    };

    const handleSendBuyerCounter = (e, rfq) => {
        e.preventDefault();
        if (!counterPriceInput) return;
        mockStore.buyerCounterRfq(rfq.id, {
            counter_price: counterPriceInput,
            message: counterMessageInput,
        });
        setIsCountering(false);
        setCounterPriceInput('');
        setCounterMessageInput('');
        setActionToast('✓ Revised counter offer sent to farmer!');
        setTimeout(() => setActionToast(null), 3000);
    };

    const handleDeclineRfq = (rfq) => {
        if (window.confirm('Are you sure you want to decline this offer and close negotiation?')) {
            mockStore.declineRfq(rfq.id, 'buyer', 'Buyer declined the counter offer.');
            setActionToast('Offer declined. Negotiation closed.');
            setTimeout(() => setActionToast(null), 3000);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* Header with Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={onBackToShopping}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 mb-2"
                    >
                        &larr; Back to Produce Store
                    </button>
                    <h2 className="text-2xl font-black text-gray-900">Your Orders & Wholesale Deals</h2>
                    <p className="text-xs text-gray-500">
                        Track deliveries, pickup PINs, and wholesale RFQ price negotiations with farmers
                    </p>
                </div>

                {/* Tabs Switcher: Orders vs Quotes */}
                <div className="bg-gray-200 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold shrink-0">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                            activeTab === 'orders'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <span>📦</span>
                        <span>Orders & Deliveries</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            activeTab === 'orders' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-300 text-gray-700'
                        }`}>
                            {orders.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('quotes')}
                        className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 relative ${
                            activeTab === 'quotes'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <span>💬</span>
                        <span>Wholesale Quotes (RFQs)</span>
                        {pendingCountersCount > 0 ? (
                            <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-black animate-pulse flex items-center gap-1">
                                <span>🔔</span> {pendingCountersCount} New
                            </span>
                        ) : (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                activeTab === 'quotes' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-300 text-gray-700'
                            }`}>
                                {rfqs.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Notification Toast */}
            {actionToast && (
                <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in">
                    <span>{actionToast}</span>
                    <button onClick={() => setActionToast(null)} className="text-emerald-200 hover:text-white font-black">&times;</button>
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: ORDERS & DELIVERIES */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'orders' && (
                <div>
                    {orders.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
                            <span className="text-5xl block">📦</span>
                            <h3 className="font-bold text-gray-800 text-lg">No orders placed yet</h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                Explore our farm direct listings or wholesale catalog to place your first fresh order.
                            </p>
                            <button
                                onClick={onBackToShopping}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                            >
                                Browse Produce &rarr;
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Orders List */}
                            <div className="space-y-3">
                                {orders.map(order => (
                                    <div
                                        key={order.id}
                                        onClick={() => setSelectedOrderId(order.id)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                            selectedOrder?.id === order.id
                                                ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <span className="font-black text-gray-900 text-sm">{order.order_number}</span>
                                                <span className="text-[11px] text-gray-500 block">{order.farm_name}</span>
                                            </div>
                                            <span className="font-extrabold text-sm text-gray-900">₹{order.total_amount.toLocaleString()}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className={`font-black uppercase px-2 py-0.5 rounded-md ${
                                                order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                order.status === 'ready_for_pickup' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                                order.status === 'pending_farmer_approval' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                                order.status === 'dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {order.status === 'pending_farmer_approval' ? '⏳ Pending Approval' : order.status.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-gray-400">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right: Selected Order Detail & Timeline Stepper */}
                            {selectedOrder && (
                                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 space-y-6 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-black text-gray-900">{selectedOrder.order_number}</h3>
                                                <span className="text-xs font-bold px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                                                    {selectedOrder.fulfillment_type === 'farm_pickup' ? '🚜 Farm Pickup' :
                                                     selectedOrder.fulfillment_type === 'b2b_freight' ? '🏭 Wholesale Freight' : '🚚 Direct Courier'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Farm: <strong>{selectedOrder.farm_name}</strong></p>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-xs text-gray-400 block">Total Paid / Payable</span>
                                            <span className="text-2xl font-black text-emerald-700">₹{selectedOrder.total_amount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* PENDING FARMER APPROVAL BANNER */}
                                    {(!selectedOrder.is_approved || selectedOrder.status === 'pending_farmer_approval') ? (
                                        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-black uppercase rounded-md animate-pulse">
                                                            Pending Farmer Approval
                                                        </span>
                                                        <span className="text-xs font-bold text-amber-950">
                                                            Action Required by Farmer
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-amber-900 leading-relaxed">
                                                        The order has been submitted to <strong>{selectedOrder.farm_name}</strong>. The farmer will review and approve harvest availability.
                                                    </p>
                                                </div>
                                                <div className="text-center p-2.5 bg-white rounded-xl border border-amber-200 shrink-0">
                                                    <span className="text-xl block">🔒</span>
                                                    <span className="text-[10px] font-black text-amber-800 uppercase block">Code Locked</span>
                                                </div>
                                            </div>

                                            <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <span className="text-[11px] text-gray-600">
                                                    {selectedOrder.fulfillment_type === 'farm_pickup'
                                                        ? '★ Your 6-digit Pickup PIN will unlock immediately once approved.'
                                                        : '★ Your 6-digit Courier Delivery Code will unlock immediately once approved.'}
                                                </span>
                                                <button
                                                    onClick={() => mockStore.setActiveRole('farmer')}
                                                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all whitespace-nowrap"
                                                >
                                                    👨‍🌾 Switch to Farmer to Approve &rarr;
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* PICKUP PIN BADGE IF FARM PICKUP */}
                                            {selectedOrder.fulfillment_type === 'farm_pickup' && (
                                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                                                            Farm Gate Verification Code (PIN)
                                                        </span>
                                                        <span className="text-3xl font-black text-amber-700 font-mono tracking-widest block my-0.5">
                                                            {selectedOrder.pickup_code || selectedOrder.pickup_details?.pickup_code}
                                                        </span>
                                                        <span className="text-[11px] text-amber-900">
                                                            Slot: <strong>{selectedOrder.pickup_details?.slot || 'Tomorrow'}</strong> &bull; Location: {selectedOrder.pickup_details?.location || 'Farm Gate'}
                                                        </span>
                                                    </div>

                                                    {selectedOrder.status === 'ready_for_pickup' ? (
                                                        <span className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-extrabold shadow-sm animate-pulse text-center">
                                                            Ready for Collection
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-extrabold shadow-sm text-center">
                                                            ✓ Handed Over & Completed
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* COURIER DELIVERY BADGE & CONFIRM RECEIPT */}
                                            {(selectedOrder.fulfillment_type === 'direct_courier' || selectedOrder.fulfillment_type === 'hub_delivery') && (
                                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 block">
                                                            Courier Delivery Verification Code
                                                        </span>
                                                        <span className="text-3xl font-black text-purple-700 font-mono tracking-widest block my-0.5">
                                                            {selectedOrder.delivery_code || selectedOrder.pickup_code || '519-823'}
                                                        </span>
                                                        <span className="text-[11px] text-purple-900 block">
                                                            Delivering to: <strong>{selectedOrder.shipping_address?.street || 'Your Address'}</strong>
                                                        </span>
                                                    </div>

                                                    <div>
                                                        {selectedOrder.status === 'delivered' || selectedOrder.status === 'completed' ? (
                                                            <span className="px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-extrabold shadow-sm text-center block">
                                                                ✓ Receipt Confirmed & Delivered
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    mockStore.confirmCourierReceipt(selectedOrder.id, selectedOrder.delivery_code);
                                                                    const updated = mockStore.getOrderById(selectedOrder.id);
                                                                    if (updated) setSelectedOrderId(updated.id);
                                                                }}
                                                                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                                                            >
                                                                <span>✓</span> Confirm Receipt of Product
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* B2B WHOLESALE FREIGHT & INWARD RECEPTION CARD */}
                                            {(selectedOrder.fulfillment_type === 'b2b_freight' || selectedOrder.customer_type === 'b2b_wholesale' || selectedOrder.channel === 'b2b_bulk') && (
                                                <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-slate-50 border-2 border-indigo-200 rounded-2xl p-5 space-y-4 shadow-sm">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-2xl p-2 bg-indigo-100 text-indigo-700 rounded-xl">🚛</span>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 bg-indigo-200/70 px-2 py-0.5 rounded">
                                                                        B2B Wholesale Freight & Logistics
                                                                    </span>
                                                                    {selectedOrder.status === 'delivered' || selectedOrder.status === 'completed' ? (
                                                                        <span className="text-[10px] font-extrabold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1">
                                                                            <span>✓</span> Inward Confirmed
                                                                        </span>
                                                                    ) : selectedOrder.status === 'dispatched' ? (
                                                                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded animate-pulse flex items-center gap-1">
                                                                            <span>🚚</span> En Route / Bay Arrival
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                                                            ⏳ Awaiting Farm Dispatch
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h4 className="text-sm font-extrabold text-gray-900 mt-0.5">
                                                                    Bulk Transport Manifest & Gate Inward
                                                                </h4>
                                                            </div>
                                                        </div>

                                                        {/* Consignment Bay */}
                                                        <div className="text-right text-xs">
                                                            <span className="text-[10px] text-gray-400 block uppercase font-bold">Consignment Bay</span>
                                                            <span className="font-extrabold text-indigo-950">
                                                                {selectedOrder.shipping_address?.street || selectedOrder.b2b_profile?.warehouse_address || 'Central Warehouse Bay 4'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Vehicle & Logistics Details Grid */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/80 p-3.5 rounded-xl border border-indigo-100">
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 font-bold block uppercase">Vehicle / Truck No.</span>
                                                            <span className="font-mono font-black text-gray-900 text-xs">
                                                                {selectedOrder.vehicle_number || (selectedOrder.status === 'dispatched' ? 'KA-04-E-5566' : 'Assigned upon loading')}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 font-bold block uppercase">Transporter / Driver</span>
                                                            <span className="font-bold text-gray-800 text-xs">
                                                                {selectedOrder.driver_name || (selectedOrder.status === 'dispatched' ? 'Fleet Logistics' : 'Designated Carrier')}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 font-bold block uppercase">Total Quantity</span>
                                                            <span className="font-black text-indigo-900 text-xs">
                                                                {selectedOrder.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0).toLocaleString()} {selectedOrder.items?.[0]?.unit || 'kg'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 font-bold block uppercase">Settlement Status</span>
                                                            <span className="font-bold text-emerald-700 text-xs">
                                                                {selectedOrder.status === 'delivered' || selectedOrder.status === 'completed' || selectedOrder.payment_status?.includes('100%') ? '✓ 100% Settled' : (selectedOrder.payment_status || 'Milestone Bank Transfer')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* ACTION 1: TRUCK DISPATCHED & AWAITING RECEPTION */}
                                                    {selectedOrder.status === 'dispatched' && (
                                                        <div className="bg-white p-4 rounded-xl border border-indigo-200 space-y-3">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                                <div>
                                                                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
                                                                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                                                                        <span>Wholesale freight has arrived at buyer destination bay!</span>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                                        Verify consignment crate count and produce quality to accept delivery and release final payment to farmer.
                                                                    </p>
                                                                </div>

                                                                <button
                                                                    onClick={() => {
                                                                        setInwardInspectorName(user?.name || user?.b2b_profile?.contact_person || 'Warehouse Inward Lead');
                                                                        setInwardGatePass(`GP-BLR-${Math.floor(100000 + Math.random() * 900000)}`);
                                                                        setInwardRemarks('All crates inspected & counted. Specifications met. Accepted into warehouse.');
                                                                        setIsB2BInwardOpen(true);
                                                                    }}
                                                                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 shrink-0"
                                                                >
                                                                    <span>✓</span> Confirm Reception of Produce & Accept Delivery
                                                                </button>
                                                            </div>

                                                            {/* Inline Inspection & Receiving Form */}
                                                            {isB2BInwardOpen && (
                                                                <div className="mt-3 pt-3 border-t border-gray-100 bg-indigo-50/60 p-3.5 rounded-xl space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                                                                            <span>📋</span> Warehouse Inward & Quality Inspection Verification
                                                                        </span>
                                                                        <button
                                                                            onClick={() => setIsB2BInwardOpen(false)}
                                                                            className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                                                                        >
                                                                            Cancel &times;
                                                                        </button>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                                                                Receiving Supervisor / Inspector Name:
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={inwardInspectorName}
                                                                                onChange={(e) => setInwardInspectorName(e.target.value)}
                                                                                placeholder="e.g. Rajesh Gupta (VP Sourcing)"
                                                                                className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                                                                Inward Gate Pass / Challan Ref:
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={inwardGatePass}
                                                                                onChange={(e) => setInwardGatePass(e.target.value)}
                                                                                placeholder="e.g. GP-BLR-8921"
                                                                                className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                                                                            Inspection Remarks & Acceptance Notes:
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={inwardRemarks}
                                                                            onChange={(e) => setInwardRemarks(e.target.value)}
                                                                            placeholder="e.g. Verified 1,000 kg. Zero transit loss. Accepted into storage."
                                                                            className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center justify-end gap-2 pt-1">
                                                                        <button
                                                                            onClick={() => setIsB2BInwardOpen(false)}
                                                                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-lg"
                                                                        >
                                                                            Close
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                mockStore.confirmB2BReception(selectedOrder.id, {
                                                                                    inspector_name: inwardInspectorName,
                                                                                    gate_pass_number: inwardGatePass,
                                                                                    inward_notes: inwardRemarks,
                                                                                });
                                                                                setIsB2BInwardOpen(false);
                                                                                setActionToast(`✓ Inward verified! Order #${selectedOrder.order_number} marked received & 100% payment released to farmer.`);
                                                                                setTimeout(() => setActionToast(null), 4000);
                                                                            }}
                                                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                                                                        >
                                                                            <span>✓</span> Sign Inward & Accept Goods
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* ACTION 2: PRE-DISPATCH (Awaiting Farmer Loading) */}
                                                    {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'pending_farmer_approval') && (
                                                        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                            <div>
                                                                <span className="font-extrabold text-amber-950 block">
                                                                    ⏳ Awaiting Farmer Dispatch & Loading
                                                                </span>
                                                                <span className="text-[11px] text-amber-800">
                                                                    Farmer is currently packing crates and loading the freight truck. Once dispatched, live reception will unlock here.
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <button
                                                                    onClick={() => mockStore.setActiveRole('farmer')}
                                                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap"
                                                                >
                                                                    👨‍🌾 Switch to Farmer Portal &rarr;
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        mockStore.confirmB2BReception(selectedOrder.id, {
                                                                            inward_notes: 'Direct buyer reception verified.',
                                                                        });
                                                                        setActionToast('✓ Freight received & logged in buyer inventory.');
                                                                        setTimeout(() => setActionToast(null), 3500);
                                                                    }}
                                                                    className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold shadow-sm"
                                                                    title="Directly receive for quick prototype testing"
                                                                >
                                                                    ⚡ Direct Receive
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ACTION 3: DELIVERED / RECEIVED */}
                                                    {(selectedOrder.status === 'delivered' || selectedOrder.status === 'completed') && (
                                                        <div className="bg-green-50/90 border border-green-200 rounded-xl p-4 space-y-2 text-xs">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-black">
                                                                        ✓
                                                                    </span>
                                                                    <span className="font-black text-green-950 text-sm">
                                                                        Wholesale Shipment Verified & Received at Warehouse
                                                                    </span>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-green-800 bg-green-200/80 px-2 py-0.5 rounded">
                                                                    Gate Pass: {selectedOrder.reception_details?.gate_pass_number || 'GP-IN-VERIFIED'}
                                                                </span>
                                                            </div>

                                                            <div className="text-[11px] text-green-900 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-green-100">
                                                                <div><strong>Received by:</strong> {selectedOrder.reception_details?.inspector_name || 'Warehouse Inward Officer'}</div>
                                                                <div><strong>Remarks:</strong> {selectedOrder.reception_details?.notes || 'Goods unloaded, crates counted, and accepted in prime condition.'}</div>
                                                                <div className="text-[10px] text-green-700 mt-1 font-semibold">
                                                                    ✓ 100% Milestone release confirmed. Full payment released to farmer account.
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Visual Timeline Stepper */}
                                    <div className="space-y-3">
                                        <h4 className="font-extrabold text-gray-800 text-sm">Fulfillment Progress</h4>
                                        <div className="space-y-3 relative pl-6 border-l-2 border-emerald-500 ml-3 text-xs">
                                            {selectedOrder.timeline.map((step, idx) => (
                                                <div key={idx} className="relative space-y-0.5">
                                                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-sm"></div>
                                                    <div className="flex items-center justify-between font-bold text-gray-900">
                                                        <span>{step.label}</span>
                                                        <span className="text-[10px] text-gray-400 font-normal">
                                                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-600">{step.note}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ordered Items Summary */}
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
                                        <span className="font-bold text-gray-800 block mb-1">Items Summary:</span>
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-gray-700">
                                                <span>{item.title} &times; <strong>{item.quantity} {item.unit}</strong></span>
                                                <span className="font-bold">₹{item.total_price.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: WHOLESALE QUOTES & RFQ NEGOTIATIONS */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'quotes' && (
                <div>
                    {rfqs.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
                            <span className="text-5xl block">💬</span>
                            <h3 className="font-bold text-gray-800 text-lg">No Wholesale Quotes Requested</h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                When you request custom pricing for bulk orders or negotiate counter-offers with farmers, they will appear here.
                            </p>
                            <button
                                onClick={onBackToShopping}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                            >
                                Browse Wholesale Catalog &rarr;
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: RFQs List */}
                            <div className="space-y-3">
                                {rfqs.map(rfq => {
                                    const latestAction = rfq.history?.[rfq.history.length - 1];
                                    const isCounter = rfq.status === 'counter_offered';

                                    return (
                                        <div
                                            key={rfq.id}
                                            onClick={() => {
                                                setSelectedRfqId(rfq.id);
                                                setIsCountering(false);
                                            }}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                                selectedRfq?.id === rfq.id
                                                    ? 'border-indigo-500 bg-indigo-50/40 shadow-sm'
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                            } ${isCounter ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div>
                                                    <span className="font-black text-gray-900 text-sm">{rfq.rfq_number}</span>
                                                    <span className="text-[11px] text-gray-500 block">{rfq.crop_name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black text-sm text-indigo-700">
                                                        ₹{latestAction ? latestAction.price : rfq.target_price_per_unit}/{rfq.unit}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 block">{rfq.requested_qty} {rfq.unit}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
                                                <span className={`font-black uppercase px-2 py-0.5 rounded-md ${
                                                    rfq.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                    rfq.status === 'counter_offered' ? 'bg-indigo-600 text-white animate-pulse' :
                                                    rfq.status === 'buyer_countered' ? 'bg-blue-100 text-blue-800' :
                                                    rfq.status === 'declined' ? 'bg-red-100 text-red-800' :
                                                    'bg-amber-100 text-amber-900'
                                                }`}>
                                                    {rfq.status === 'counter_offered' ? '🔔 Counter Received!' :
                                                     rfq.status === 'buyer_countered' ? '⏳ Counter Sent' :
                                                     rfq.status === 'open' ? '⏳ Awaiting Farmer' :
                                                     rfq.status.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-gray-400">
                                                    {rfq.farm_name}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right: Selected RFQ Detail & Negotiation Actions */}
                            {selectedRfq && (
                                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 space-y-6 shadow-sm">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-black text-gray-900">{selectedRfq.rfq_number}</h3>
                                                <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                                                    Wholesale RFQ
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Produce: <strong>{selectedRfq.crop_name}</strong> &bull; Farm: <strong>{selectedRfq.farm_name}</strong>
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-xs text-gray-400 block">Requested Volume</span>
                                            <span className="text-lg font-black text-gray-900">{selectedRfq.requested_qty} {selectedRfq.unit}</span>
                                        </div>
                                    </div>

                                    {/* Key Deal Comparison */}
                                    <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl text-xs">
                                        <div>
                                            <span className="text-gray-400 block font-semibold">Your Target Price:</span>
                                            <span className="text-base font-extrabold text-gray-700">₹{selectedRfq.target_price_per_unit}/{selectedRfq.unit}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block font-semibold">Base Listing Price:</span>
                                            <span className="text-base font-extrabold text-gray-400 line-through">₹{selectedRfq.current_listing_price}/{selectedRfq.unit}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block font-semibold">Current Offer:</span>
                                            <span className="text-base font-black text-indigo-700">
                                                ₹{selectedRfq.history?.[selectedRfq.history.length - 1]?.price || selectedRfq.target_price_per_unit}/{selectedRfq.unit}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ── ACTION BANNERS DEPENDING ON RFQ STATUS ── */}

                                    {/* 1. COUNTER OFFER RECEIVED FROM FARMER */}
                                    {selectedRfq.status === 'counter_offered' && (
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-3xl p-5 space-y-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-md animate-pulse">
                                                            🔔 Action Required
                                                        </span>
                                                        <span className="text-xs font-black text-indigo-950">
                                                            Farmer Sent Counter Offer!
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-indigo-900 mt-1 leading-relaxed">
                                                        <strong>{selectedRfq.farmer_name}</strong> reviewed your bulk proposal and proposed a revised price:
                                                    </p>
                                                </div>

                                                <div className="text-right shrink-0 bg-white p-2.5 rounded-2xl border border-indigo-200">
                                                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Counter Price</span>
                                                    <span className="text-2xl font-black text-indigo-700">
                                                        ₹{selectedRfq.history?.[selectedRfq.history.length - 1]?.price}/{selectedRfq.unit}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-bold block">
                                                        Total: ₹{(selectedRfq.history?.[selectedRfq.history.length - 1]?.price * selectedRfq.requested_qty).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Note from Farmer */}
                                            {selectedRfq.history?.[selectedRfq.history.length - 1]?.message && (
                                                <div className="bg-white/90 p-3 rounded-xl border border-indigo-200 text-xs text-indigo-950">
                                                    <span className="font-bold text-indigo-800 block mb-0.5">💬 Farmer's Note:</span>
                                                    <p className="italic">"{selectedRfq.history[selectedRfq.history.length - 1].message}"</p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            {!isCountering ? (
                                                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                                                    <button
                                                        onClick={() => handleAcceptCounter(selectedRfq)}
                                                        className="w-full sm:flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95"
                                                    >
                                                        <span>✓</span> Accept Counter Offer & Confirm Order &rarr;
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setIsCountering(true);
                                                            const lastPrice = selectedRfq.history?.[selectedRfq.history.length - 1]?.price || selectedRfq.target_price_per_unit;
                                                            setCounterPriceInput(Math.round((lastPrice + selectedRfq.target_price_per_unit) / 2));
                                                        }}
                                                        className="w-full sm:w-auto px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <span>💬</span> Counter Back
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeclineRfq(selectedRfq)}
                                                        className="w-full sm:w-auto px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        ✕ Decline
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Inline Counter Form */
                                                <form onSubmit={(e) => handleSendBuyerCounter(e, selectedRfq)} className="bg-white p-4 rounded-2xl border border-indigo-200 space-y-3">
                                                    <h5 className="font-extrabold text-gray-900 text-xs">Propose Revised Counter Offer</h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                                                Your Revised Price (₹/{selectedRfq.unit})
                                                            </label>
                                                            <input
                                                                type="number"
                                                                required
                                                                min="1"
                                                                value={counterPriceInput}
                                                                onChange={(e) => setCounterPriceInput(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded-xl text-xs font-black text-indigo-700 focus:outline-none focus:border-indigo-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                                                Message / Note to Farmer
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Can meet in middle if loading is included."
                                                                value={counterMessageInput}
                                                                onChange={(e) => setCounterMessageInput(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2 pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCountering(false)}
                                                            className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-bold"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold shadow-sm"
                                                        >
                                                            Send Counter to Farmer &rarr;
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    )}

                                    {/* 2. WAITING FOR FARMER REVIEW */}
                                    {selectedRfq.status === 'open' && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-black uppercase rounded-md">
                                                    ⏳ In Review
                                                </span>
                                                <span className="font-bold">Awaiting Farmer Response</span>
                                            </div>
                                            <p className="text-[11px] text-amber-900 leading-relaxed">
                                                Your proposal of <strong>₹{selectedRfq.target_price_per_unit}/{selectedRfq.unit}</strong> for {selectedRfq.requested_qty} {selectedRfq.unit} was delivered to <strong>{selectedRfq.farmer_name}</strong>. The farmer will review and counter or accept.
                                            </p>
                                            <button
                                                onClick={() => mockStore.setActiveRole('farmer')}
                                                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                <span>👨‍🌾</span> Switch to Farmer Portal to Counter / Accept Deal &rarr;
                                            </button>
                                        </div>
                                    )}

                                    {/* 3. BUYER REVISED COUNTER SENT */}
                                    {selectedRfq.status === 'buyer_countered' && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-md">
                                                    ⏳ Counter Sent
                                                </span>
                                                <span className="font-bold">Your Counter-Offer is with the Farmer</span>
                                            </div>
                                            <p className="text-[11px] text-blue-900 leading-relaxed">
                                                You sent a revised offer of <strong>₹{selectedRfq.history?.[selectedRfq.history.length - 1]?.price}/{selectedRfq.unit}</strong>. Waiting for {selectedRfq.farmer_name}'s confirmation.
                                            </p>
                                            <button
                                                onClick={() => mockStore.setActiveRole('farmer')}
                                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm inline-flex items-center gap-1.5"
                                            >
                                                <span>👨‍🌾</span> Switch to Farmer App to Finalize / Re-Counter &rarr;
                                            </button>
                                        </div>
                                    )}

                                    {/* 4. DEAL AGREED */}
                                    {selectedRfq.status === 'accepted' && (
                                        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 text-xs text-green-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-0.5 bg-green-600 text-white text-[10px] font-black uppercase rounded-md">
                                                        ✓ Finalized
                                                    </span>
                                                    <span className="font-extrabold text-sm text-green-950">
                                                        Deal Agreed & Converted to Order!
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-green-900 mt-1">
                                                    Agreement locked at <strong>₹{selectedRfq.history?.[selectedRfq.history.length - 1]?.price}/{selectedRfq.unit}</strong>. B2B order has been generated.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('orders')}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black shadow-sm shrink-0"
                                            >
                                                View in Orders Tab &rarr;
                                            </button>
                                        </div>
                                    )}

                                    {/* 5. DECLINED */}
                                    {selectedRfq.status === 'declined' && (
                                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-900">
                                            <span className="font-extrabold block mb-1">✕ Negotiation Closed</span>
                                            <p className="text-[11px] text-red-800">
                                                This wholesale quote request was declined. You can submit a new RFQ anytime from the Wholesale catalog.
                                            </p>
                                        </div>
                                    )}

                                    {/* Negotiation Timeline / History Thread */}
                                    <div className="space-y-3">
                                        <h4 className="font-extrabold text-gray-800 text-sm">Negotiation History</h4>
                                        <div className="space-y-3">
                                            {(selectedRfq.history || []).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-2xl border text-xs ${
                                                        item.by === 'farmer'
                                                            ? 'bg-emerald-50/60 border-emerald-200 ml-4'
                                                            : 'bg-indigo-50/60 border-indigo-200 mr-4'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                                                        <span className={item.by === 'farmer' ? 'text-emerald-900' : 'text-indigo-900'}>
                                                            {item.by === 'farmer' ? `👨‍🌾 ${selectedRfq.farmer_name} (Farmer)` : '🏢 You (Buyer)'}
                                                        </span>
                                                        <span className="text-gray-400 font-normal">
                                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-700">{item.message}</p>
                                                    <div className="mt-2 flex items-center justify-between text-[11px] font-black pt-1 border-t border-gray-200/50">
                                                        <span>Price: ₹{item.price}/{selectedRfq.unit}</span>
                                                        <span className="capitalize text-gray-500 font-semibold">{item.action.replace(/_/g, ' ')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
