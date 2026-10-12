import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function NurseryOrdersView() {
    const nursery = mockStore.getCurrentNursery();
    const orders = mockStore.getNurseryOrders({ nurseryId: nursery?.id });

    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'ready' | 'pending' | 'completed'

    // Modal state for PIN verification
    const [verifyingOrder, setVerifyingOrder] = useState(null);
    const [enteredPin, setEnteredPin] = useState('');
    const [pinError, setPinError] = useState('');

    // Modal state for dispatching delivery
    const [dispatchingOrder, setDispatchingOrder] = useState(null);
    const [truckNumber, setTruckNumber] = useState('KA-11-N-4422');
    const [driverName, setDriverName] = useState('Nursery Logistics Team');
    const [trackingNumber, setTrackingNumber] = useState('');

    const [toastMessage, setToastMessage] = useState(null);

    const filteredOrders = orders.filter((o) => {
        if (filterStatus === 'ready') return o.status === 'ready_for_pickup' || o.status === 'ready_for_dispatch';
        if (filterStatus === 'completed') return o.status === 'completed';
        if (filterStatus === 'pending') return o.status !== 'completed';
        return true;
    });

    const handleConfirmPickup = (e) => {
        e.preventDefault();
        setPinError('');
        const res = mockStore.confirmNurseryOrderPickup(verifyingOrder.id, enteredPin);
        if (res.error) {
            setPinError(res.error);
        } else {
            setToastMessage(`✓ Handover verified! Order #${verifyingOrder.order_number} marked completed and 100% settled.`);
            setVerifyingOrder(null);
            setEnteredPin('');
            setTimeout(() => setToastMessage(null), 3500);
        }
    };

    const handleDispatchDelivery = (e) => {
        e.preventDefault();
        mockStore.dispatchNurseryDelivery(dispatchingOrder.id, {
            vehicle_number: truckNumber,
            driver_name: driverName,
            tracking_number: trackingNumber || `NTRK-${Math.floor(100000 + Math.random() * 900000)}`,
        });
        setToastMessage(`🚚 Order #${dispatchingOrder.order_number} dispatched for farm delivery!`);
        setDispatchingOrder(null);
        setTimeout(() => setToastMessage(null), 3500);
    };

    return (
        <div className="space-y-6">
            {toastMessage && (
                <div className="p-4 bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-between animate-fadeIn">
                    <span>{toastMessage}</span>
                    <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white font-bold">&times;</button>
                </div>
            )}

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl text-xs font-bold">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1.5 rounded-xl transition-all ${
                            filterStatus === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        All Orders ({orders.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('ready')}
                        className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                            filterStatus === 'ready' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <span>⚡</span> Ready for Handover / Dispatch
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-3 py-1.5 rounded-xl transition-all ${
                            filterStatus === 'pending' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        In Progress / Growing
                    </button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`px-3 py-1.5 rounded-xl transition-all ${
                            filterStatus === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Completed ({orders.filter(o => o.status === 'completed').length})
                    </button>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                    Showing <strong>{filteredOrders.length}</strong> orders
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
                    <span className="text-5xl block">📦</span>
                    <h3 className="font-bold text-gray-800 text-base">No Orders in this View</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Orders placed by farmers and retail customers for seeds and saplings will appear here with fulfillment actions.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((ord) => {
                        const isPickup = ord.fulfillment_type === 'nursery_pickup';
                        const isReadyForPickup = ord.status === 'ready_for_pickup';
                        const isReadyForDispatch = ord.status === 'ready_for_dispatch' || (ord.status === 'confirmed' && !ord.is_pre_order);
                        const isCompleted = ord.status === 'completed';

                        return (
                            <div
                                key={ord.id}
                                className="bg-white rounded-3xl border border-gray-200 p-5 space-y-4 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold">
                                            {isPickup ? '🚜' : '🚚'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-gray-900 text-sm">{ord.order_number}</span>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                                    ord.is_pre_order ? 'bg-indigo-100 text-indigo-900' : 'bg-emerald-100 text-emerald-900'
                                                }`}>
                                                    {ord.is_pre_order ? 'Pre-Order Batch' : 'Readily Available'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                                    isCompleted
                                                        ? 'bg-green-100 text-green-800'
                                                        : isReadyForPickup || isReadyForDispatch
                                                        ? 'bg-purple-100 text-purple-900 animate-pulse'
                                                        : 'bg-amber-100 text-amber-900'
                                                }`}>
                                                    {ord.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Customer: <strong>{ord.customer_name}</strong> ({ord.customer_phone}) &bull; Date: {new Date(ord.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right text-xs">
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Order Value</span>
                                        <span className="text-lg font-black text-emerald-800">₹{ord.subtotal.toLocaleString()}</span>
                                        <span className="text-[10px] text-gray-500 block">{ord.payment_status}</span>
                                    </div>
                                </div>

                                {/* Order Item & Fulfillment Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-3.5 rounded-2xl">
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Plant / Seed Offering</span>
                                        <span className="font-black text-gray-900 block text-xs mt-0.5">{ord.item_title}</span>
                                        <span className="text-gray-600 block text-[11px]">
                                            Quantity: <strong>{ord.quantity} {ord.unit}</strong> (@ ₹{ord.unit_price}/{ord.unit})
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Fulfillment Method</span>
                                        <span className="font-extrabold text-gray-800 block text-xs mt-0.5">
                                            {isPickup ? '🚜 Nursery Gate Pickup' : '🚚 Direct Nursery Delivery'}
                                        </span>
                                        <span className="text-[11px] text-gray-500 block">
                                            {isPickup
                                                ? `Collection Location: ${ord.pickup_details?.location || 'Nursery Main Gate'}`
                                                : `Delivery Address: ${ord.shipping_address?.street || 'Farm Address'}`}
                                        </span>
                                    </div>
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                    <div className="text-xs">
                                        {ord.is_pre_order && (
                                            <span className="text-indigo-900 font-bold flex items-center gap-1.5">
                                                <span>🌱</span> Current Growth Stage: <strong className="uppercase">{ord.current_stage}</strong>
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* PICKUP PIN VERIFICATION BUTTON */}
                                        {isPickup && isReadyForPickup && (
                                            <button
                                                onClick={() => {
                                                    setVerifyingOrder(ord);
                                                    setEnteredPin(ord.pickup_code || '');
                                                    setPinError('');
                                                }}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                                            >
                                                <span>🔑</span> Verify Pickup PIN & Handover Plants
                                            </button>
                                        )}

                                        {/* DISPATCH DELIVERY BUTTON */}
                                        {!isPickup && (isReadyForDispatch || ord.status === 'confirmed') && (
                                            <button
                                                onClick={() => {
                                                    setDispatchingOrder(ord);
                                                    setTrackingNumber(`NTRK-${Math.floor(100000 + Math.random() * 900000)}`);
                                                }}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                                            >
                                                <span>🚚</span> Dispatch Plants for Delivery
                                            </button>
                                        )}

                                        {isCompleted && (
                                            <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-xl text-xs font-bold flex items-center gap-1">
                                                <span>✓</span> Handed Over & 100% Settled
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL: VERIFY PICKUP PIN */}
            {verifyingOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 border border-purple-100">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🔑</span>
                                <div>
                                    <h3 className="text-base font-black text-gray-900">Verify Pickup Handover PIN</h3>
                                    <p className="text-xs text-gray-500">Order: {verifyingOrder.order_number}</p>
                                </div>
                            </div>
                            <button onClick={() => setVerifyingOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                                &times;
                            </button>
                        </div>

                        {pinError && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
                                {pinError}
                            </div>
                        )}

                        <form onSubmit={handleConfirmPickup} className="space-y-4">
                            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1">
                                <span>Buyer: <strong>{verifyingOrder.customer_name}</strong></span>
                                <span className="block">Plants: <strong>{verifyingOrder.quantity} {verifyingOrder.unit}</strong> of {verifyingOrder.item_title}</span>
                                <span className="block text-[11px] text-purple-800 mt-1">
                                    Ask the customer for their 6-digit pickup verification code before handing over seedlings.
                                </span>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-700">Enter Customer 6-Digit PIN:</label>
                                <input
                                    type="text"
                                    value={enteredPin}
                                    onChange={(e) => setEnteredPin(e.target.value)}
                                    placeholder="e.g. 581920"
                                    className="w-full p-3 border-2 border-purple-300 rounded-2xl text-center font-mono text-2xl font-black text-purple-900 tracking-widest focus:outline-none focus:border-purple-600"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setVerifyingOrder(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md transition-all"
                                >
                                    ✓ Confirm Handover & Complete Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: DISPATCH DELIVERY */}
            {dispatchingOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 border border-blue-100">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🚚</span>
                                <div>
                                    <h3 className="text-base font-black text-gray-900">Dispatch Plants for Delivery</h3>
                                    <p className="text-xs text-gray-500">Order: {dispatchingOrder.order_number}</p>
                                </div>
                            </div>
                            <button onClick={() => setDispatchingOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleDispatchDelivery} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Vehicle / Transport Truck No.:</label>
                                <input
                                    type="text"
                                    value={truckNumber}
                                    onChange={(e) => setTruckNumber(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Transporter / Driver Name:</label>
                                <input
                                    type="text"
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block font-bold text-gray-700">Tracking Number / Challan Ref:</label>
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDispatchingOrder(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all"
                                >
                                    🚚 Confirm Dispatch to Farm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
