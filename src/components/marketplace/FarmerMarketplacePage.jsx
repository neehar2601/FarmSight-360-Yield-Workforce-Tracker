import React, { useState, useEffect } from 'react';
import { mockStore } from '../../mock/mockStore';
import NurseryStorefrontView from '../consumer/NurseryStorefrontView';
import NurseryOrdersTab from '../consumer/NurseryOrdersTab';

export default function FarmerMarketplacePage() {
    const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'orders' | 'consignments' | 'rfqs' | 'earnings' | 'nursery_sourcing'
    const [, setTick] = useState(0);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [selectedOrderForPin, setSelectedOrderForPin] = useState(null);
    const [enteredPin, setEnteredPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinSuccess, setPinSuccess] = useState(false);

    const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
    const [selectedOrderForCourier, setSelectedOrderForCourier] = useState(null);
    const [carrierName, setCarrierName] = useState('Porter Express');
    const [trackingNumber, setTrackingNumber] = useState('');

    const [isB2BDispatchModalOpen, setIsB2BDispatchModalOpen] = useState(false);
    const [selectedOrderForB2B, setSelectedOrderForB2B] = useState(null);
    const [b2bTruckNumber, setB2bTruckNumber] = useState('KA-04-E-5566');
    const [b2bDriverName, setB2bDriverName] = useState('Ramesh Kumar (+91 98450 12345)');
    const [b2bChallanNumber, setB2bChallanNumber] = useState('');
    const [b2bSuccess, setB2bSuccess] = useState(false);

    const [isConsignmentModalOpen, setIsConsignmentModalOpen] = useState(false);
    const [consignmentForm, setConsignmentForm] = useState({
        crop_name: 'Hybrid Roma Tomatoes',
        grade_declared: 'Grade A',
        dispatched_qty: 500,
        unit: 'kg',
        vehicle_number: 'KA-04-E-8821',
        driver_name: 'Manjunath',
        expected_price_per_unit: 40,
        notes: '',
    });

    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    const [selectedRfqForCounter, setSelectedRfqForCounter] = useState(null);
    const [counterPrice, setCounterPrice] = useState('');
    const [counterMessage, setCounterMessage] = useState('');

    // Re-render when mockStore updates
    useEffect(() => {
        const unsub = mockStore.subscribe(() => setTick(t => t + 1));
        return unsub;
    }, []);

    const currentFarm = mockStore.getCurrentFarm();
    const farmListings = mockStore.getListings({ farmId: currentFarm?.id });
    const farmOrders = mockStore.getOrders({ farmId: currentFarm?.id });
    const farmConsignments = mockStore.getConsignments(currentFarm?.id);
    const farmRfqs = mockStore.getRfqs({ farmId: currentFarm?.id });

    // Pending counts for badges
    const pendingPickupsCount = farmOrders.filter(o => o.fulfillment_type === 'farm_pickup' && o.status === 'ready_for_pickup').length;
    const pendingApprovalsCount = farmOrders.filter(o => o.status === 'pending_farmer_approval').length;
    const pendingRfqsCount = farmRfqs.filter(r => r.status === 'open' || r.status === 'buyer_countered').length;

    // Handle PIN Verification
    const handleVerifyPin = () => {
        if (!enteredPin) {
            setPinError('Please enter the 6-digit PIN');
            return;
        }
        const res = mockStore.verifyPickupPin(selectedOrderForPin.id, enteredPin);
        if (res.error) {
            setPinError(res.error);
        } else {
            setPinSuccess(true);
            setPinError('');
            setTimeout(() => {
                setIsPinModalOpen(false);
                setPinSuccess(false);
                setEnteredPin('');
                setSelectedOrderForPin(null);
            }, 1200);
        }
    };

    // Handle Courier Dispatch
    const handleDispatchCourier = () => {
        if (!selectedOrderForCourier) return;
        mockStore.dispatchDirectCourier(selectedOrderForCourier.id, {
            carrier_name: carrierName,
            tracking_number: trackingNumber || `PRTR-${Math.floor(100000 + Math.random() * 900000)}`,
        });
        setIsCourierModalOpen(false);
        setSelectedOrderForCourier(null);
    };

    // Handle B2B Wholesale Order Dispatch (Requirement 4.b: Updates quantity to sold post user sends)
    const handleDispatchB2B = () => {
        if (!selectedOrderForB2B) return;
        mockStore.dispatchB2BOrder(selectedOrderForB2B.id, {
            vehicle_number: b2bTruckNumber || 'KA-04-E-5566',
            driver_name: b2bDriverName || 'Fleet Driver',
            notes: b2bChallanNumber ? `Delivery Challan: ${b2bChallanNumber}` : undefined,
        });
        setB2bSuccess(true);
        setTimeout(() => {
            setIsB2BDispatchModalOpen(false);
            setB2bSuccess(false);
            setSelectedOrderForB2B(null);
        }, 1200);
    };

    // Handle Consignment Dispatch to Depot
    const handleCreateConsignment = (e) => {
        e.preventDefault();
        mockStore.createConsignment(consignmentForm);
        setIsConsignmentModalOpen(false);
    };

    // Handle Counter Offer
    const handleSendCounter = () => {
        if (!counterPrice) return;
        mockStore.farmerCounterRfq(selectedRfqForCounter.id, {
            counter_price: counterPrice,
            message: counterMessage,
        });
        setIsCounterModalOpen(false);
        setSelectedRfqForCounter(null);
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-200 text-sm font-semibold uppercase tracking-wider mb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Marketplace & Sales Hub
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Farm Direct & Wholesale Selling
                        </h1>
                        <p className="text-emerald-100 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
                            Sell directly to local consumers (Farm Pickup & Courier), consign harvest batches to farm360 Central Depot, and negotiate high-volume B2B wholesale deals.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setIsConsignmentModalOpen(true)}
                            className="px-4 py-2.5 bg-emerald-900/60 hover:bg-emerald-900/90 text-emerald-100 border border-emerald-500/30 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm backdrop-blur"
                        >
                            <span>🚚</span> Dispatch to Central Hub
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl text-sm font-extrabold transition-all shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="text-lg leading-none">+</span> List Produce for Sale
                        </button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-1 scrollbar-none border-t border-emerald-600/50 pt-4">
                    <button
                        onClick={() => setActiveTab('listings')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'listings'
                                ? 'bg-white text-emerald-900 shadow-md'
                                : 'text-emerald-100 hover:bg-emerald-700/50'
                        }`}
                    >
                        <span>📋</span> My Listings ({farmListings.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'orders'
                                ? 'bg-white text-emerald-900 shadow-md'
                                : 'text-emerald-100 hover:bg-emerald-700/50'
                        }`}
                    >
                        <span>📦</span> Orders Received ({farmOrders.length})
                        {pendingApprovalsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-black animate-pulse">
                                {pendingApprovalsCount} Needs Approval
                            </span>
                        )}
                        {pendingPickupsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-black">
                                {pendingPickupsCount} Pickup PINs
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('consignments')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'consignments'
                                ? 'bg-white text-emerald-900 shadow-md'
                                : 'text-emerald-100 hover:bg-emerald-700/50'
                        }`}
                    >
                        <span>🚚</span> Central Hub Consignments ({farmConsignments.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('rfqs')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'rfqs'
                                ? 'bg-white text-emerald-900 shadow-md'
                                : 'text-emerald-100 hover:bg-emerald-700/50'
                        }`}
                    >
                        <span>🤝</span> Wholesale Deals (RFQs) ({farmRfqs.length})
                        {pendingRfqsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-black">
                                {pendingRfqsCount} New
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('earnings')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'earnings'
                                ? 'bg-white text-emerald-900 shadow-md'
                                : 'text-emerald-100 hover:bg-emerald-700/50'
                        }`}
                    >
                        <span>💰</span> Revenue & Settlements
                    </button>

                    <button
                        onClick={() => setActiveTab('nursery_sourcing')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'nursery_sourcing'
                                ? 'bg-lime-400 text-emerald-950 shadow-md font-black'
                                : 'text-emerald-100 hover:bg-emerald-700/50'
                        }`}
                    >
                        <span>🌱</span> Sourcing: Seeds & Saplings
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: 1. LISTINGS */}
            {activeTab === 'listings' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Active Produce Offerings</h2>
                            <p className="text-gray-500 text-xs">Live on the customer app and B2B wholesale portal</p>
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {farmListings.length} Active Listings
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {farmListings.map(listing => (
                            <div key={listing.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                                <div>
                                    <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                                        <img
                                            src={listing.image_url}
                                            alt={listing.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                            <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm text-white ${
                                                listing.channel === 'direct' ? 'bg-emerald-600' :
                                                listing.channel === 'b2b_bulk' ? 'bg-indigo-600' : 'bg-blue-600'
                                            }`}>
                                                {listing.channel === 'direct' ? 'Direct to Consumer' :
                                                 listing.channel === 'b2b_bulk' ? 'B2B Wholesale' : 'Hub Consignment'}
                                            </span>
                                            {listing.is_certified_organic && (
                                                <span className="text-[10px] font-bold px-2 py-1 bg-amber-500 text-white rounded-full shadow-sm">
                                                    Organic
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-white text-xs px-2.5 py-1 rounded-lg font-bold">
                                            Stock: {listing.available_qty} {listing.unit}
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-gray-900 text-base leading-snug">{listing.title}</h3>
                                            <span className="text-emerald-700 font-extrabold text-base whitespace-nowrap">
                                                ₹{listing.price_per_unit.toLocaleString()}
                                                <span className="text-xs text-gray-500 font-normal">/{listing.unit}</span>
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-500 line-clamp-2">{listing.description}</p>

                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                                                Grade: {listing.grade}
                                            </span>
                                            {listing.pickup_available && (
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                    🚜 Farm Pickup
                                                </span>
                                            )}
                                            {listing.courier_available && (
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                    🚚 Courier
                                                </span>
                                            )}
                                        </div>

                                        {listing.bulk_tiers && (
                                            <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-2.5">
                                                <p className="text-[11px] font-bold text-indigo-900 mb-1">Volume Pricing Tiers:</p>
                                                <div className="space-y-0.5 text-[10px] text-indigo-700">
                                                    {listing.bulk_tiers.map((tier, i) => (
                                                        <div key={i} className="flex justify-between">
                                                            <span>{tier.label}</span>
                                                            <span className="font-bold">₹{tier.price_per_unit}/{listing.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 pt-0 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 mt-2">
                                    <span>Harvested: {listing.harvest_date}</span>
                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live on Store
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 2. ORDERS & PICKUPS */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Incoming Customer Orders</h2>
                            <p className="text-gray-500 text-xs">Verify 6-digit pickup PINs for farm pickups, and enter tracking for direct couriers</p>
                        </div>
                    </div>

                    {/* ATTENTION CALLOUT: ORDERS NEEDING APPROVAL */}
                    {pendingApprovalsCount > 0 && (
                        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">⏳</span>
                                <div>
                                    <h4 className="font-extrabold text-amber-950 text-sm">
                                        {pendingApprovalsCount} Customer Order{pendingApprovalsCount > 1 ? 's' : ''} Awaiting Your Approval
                                    </h4>
                                    <p className="text-xs text-amber-800">
                                        Review incoming harvest requests. Once you approve, the customer's secure verification code is unlocked to permit pickup or courier handover.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {farmOrders.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
                                <span className="text-4xl">📦</span>
                                <p className="mt-2 text-gray-600 font-medium">No orders received yet.</p>
                            </div>
                        ) : (
                            farmOrders.map(order => (
                                <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-emerald-300 transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
                                                {order.fulfillment_type === 'farm_pickup' ? '🚜' :
                                                 order.fulfillment_type === 'b2b_freight' ? '🏭' : '🚚'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-gray-900 text-base">{order.order_number}</span>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                        order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'ready_for_pickup' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                                        order.status === 'pending_farmer_approval' ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black animate-pulse' :
                                                        order.status === 'dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {order.status === 'pending_farmer_approval' ? '⏳ Pending Approval' : order.status.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                                                        {order.fulfillment_type === 'farm_pickup' ? 'Farm Gate Pickup' :
                                                         order.fulfillment_type === 'b2b_freight' ? 'Wholesale Freight' : 'Direct Courier'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Customer: <span className="font-bold text-gray-800">{order.customer_name}</span> ({order.customer_phone})
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="text-xs text-gray-400 block">Total Amount</span>
                                                <span className="text-lg font-extrabold text-emerald-700">₹{order.total_amount.toLocaleString()}</span>
                                                <span className="text-[10px] text-gray-500 block">({order.payment_method.replace(/_/g, ' ')})</span>
                                            </div>

                                            {/* Action Buttons based on Fulfillment Type & Approval */}
                                            {order.status === 'pending_farmer_approval' && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => mockStore.approveOrder(order.id)}
                                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:scale-105 shrink-0"
                                                    >
                                                        <span>✓</span> Accept & Approve Order
                                                    </button>
                                                    <button
                                                        onClick={() => mockStore.declineOrder(order.id, 'Harvest capacity reached')}
                                                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-all shrink-0"
                                                    >
                                                        ✕ Decline
                                                    </button>
                                                </div>
                                            )}

                                            {order.fulfillment_type === 'farm_pickup' && order.status === 'ready_for_pickup' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrderForPin(order);
                                                        setIsPinModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:scale-105 shrink-0"
                                                >
                                                    <span>🔑</span> Verify Pickup PIN & Handover
                                                </button>
                                            )}

                                            {order.fulfillment_type === 'direct_courier' && order.status === 'confirmed' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrderForCourier(order);
                                                        setIsCourierModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
                                                >
                                                    <span>📦</span> Dispatch & Add Tracking
                                                </button>
                                            )}

                                            {order.fulfillment_type === 'direct_courier' && order.status === 'dispatched' && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="px-2.5 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold">
                                                        🚚 In Transit ({order.tracking_number || 'TRK-DTDC'}) &bull; Code: <strong>{order.delivery_code || '519-823'}</strong>
                                                    </span>
                                                    <button
                                                        onClick={() => mockStore.confirmCourierReceipt(order.id, order.delivery_code)}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 hover:scale-105"
                                                        title="Mark delivered and record crop sale"
                                                    >
                                                        <span>✓</span> Confirm Delivered (Sold)
                                                    </button>
                                                </div>
                                            )}

                                            {order.fulfillment_type === 'direct_courier' && order.status === 'delivered' && (
                                                <span className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                    <span>✓</span> Delivered & Recorded as Sold
                                                </span>
                                            )}

                                            {/* Requirement 4.b: B2B Order Dispatch Trigger */}
                                            {order.fulfillment_type === 'b2b_freight' && order.status === 'confirmed' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrderForB2B(order);
                                                        setIsB2BDispatchModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:scale-105 shrink-0"
                                                >
                                                    <span>🚚</span> Confirm Loaded & Dispatch Truck
                                                </button>
                                            )}

                                            {order.fulfillment_type === 'b2b_freight' && order.status === 'dispatched' && (
                                                <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                    <span>🚚</span> Dispatched on Truck (Moved to Sold)
                                                </span>
                                            )}

                                            {order.fulfillment_type === 'b2b_freight' && (order.status === 'delivered' || order.status === 'completed') && (
                                                <span className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                    <span>✓</span> Goods Received by Buyer & 100% Settled
                                                </span>
                                            )}

                                            {order.fulfillment_type !== 'b2b_freight' && (order.status === 'completed' || order.status === 'delivered') && (
                                                <span className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                    <span>✓</span> Completed & Credited
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items list */}
                                    <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-gray-700 gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {order.items.map((item, idx) => (
                                                <span key={idx} className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg">
                                                    <span className="font-semibold text-gray-800">{item.title}</span> &times; {item.quantity} {item.unit}
                                                    <span className="text-gray-400 ml-1.5">(@ ₹{item.unit_price}/{item.unit})</span>
                                                </span>
                                            ))}
                                        </div>

                                        {order.fulfillment_type === 'farm_pickup' && (
                                            <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                                Slot: <strong>{order.pickup_details?.slot}</strong>
                                            </div>
                                        )}

                                        {order.fulfillment_type === 'direct_courier' && order.tracking_number && (
                                            <div className="text-[11px] text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                                                Carrier: <strong>{order.carrier_name}</strong> | Tracking: <strong>{order.tracking_number}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 3. CENTRAL HUB CONSIGNMENTS (Channel 2) */}
            {activeTab === 'consignments' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Central Depot Consignments</h2>
                            <p className="text-gray-500 text-xs">Bulk dispatches sent to farm360 Central Hub for QA inspection and consolidated multi-farm delivery</p>
                        </div>
                        <button
                            onClick={() => setIsConsignmentModalOpen(true)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                            <span>+</span> Create New Dispatch
                        </button>
                    </div>

                    <div className="space-y-3">
                        {farmConsignments.map(con => (
                            <div key={con.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-gray-900 text-base">{con.crop_name}</span>
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                con.status === 'verified_and_stocked' ? 'bg-green-100 text-green-800' :
                                                con.status === 'in_transit' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-gray-100'
                                            }`}>
                                                {con.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Consignment #{con.id} &bull; Dispatched: {new Date(con.dispatch_date).toLocaleDateString()} via {con.vehicle_number} ({con.driver_name})
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 block">Dispatched Quantity</span>
                                        <span className="text-lg font-bold text-gray-800">{con.dispatched_qty} {con.unit}</span>
                                    </div>
                                </div>

                                {con.status === 'verified_and_stocked' ? (
                                    <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                                        <div className="flex items-center justify-between font-bold text-emerald-950">
                                            <span>QA Inspection Report &bull; {con.qa_inspector}</span>
                                            <span>Accepted: {con.received_qty} {con.unit} (Transit loss: {con.transit_cull_qty} {con.unit})</span>
                                        </div>
                                        <p className="text-emerald-800 text-[11px]">{con.inspector_notes}</p>
                                        <div className="pt-1 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                                            <span>✓</span> Live in Central Depot Stock @ ₹{con.market_price_per_unit}/{con.unit}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
                                        <span>Truck is in-transit to farm360 Central Depot #1. Awaiting weighbridge and QA check.</span>
                                        <span className="font-bold text-[11px]">ETA: Today afternoon</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 4. B2B RFQS (Channel 3) */}
            {activeTab === 'rfqs' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Wholesale Quotes & RFQs</h2>
                            <p className="text-gray-500 text-xs">High-volume price inquiries from verified supermarkets and commercial buyers</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {farmRfqs.map(rfq => (
                            <div key={rfq.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-indigo-200 transition-all">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-gray-900 text-base">{rfq.buyer_name}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                                                GST: {rfq.buyer_gstin}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                rfq.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                rfq.status === 'counter_offered' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {rfq.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Requested: <strong className="text-gray-800">{rfq.requested_qty} {rfq.unit}</strong> of <strong>{rfq.crop_name}</strong>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="text-xs text-gray-400 block">Buyer Target Price</span>
                                            <span className="text-lg font-black text-indigo-700">₹{rfq.target_price_per_unit}/{rfq.unit}</span>
                                            <span className="text-[10px] text-gray-400 line-through">List: ₹{rfq.current_listing_price}</span>
                                        </div>

                                        {rfq.status === 'open' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => mockStore.acceptRfq(rfq.id, 'farmer')}
                                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                                    title={`Accept proposal at ₹${rfq.target_price_per_unit}/${rfq.unit}`}
                                                >
                                                    ✓ Accept ₹{rfq.target_price_per_unit}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRfqForCounter(rfq);
                                                        setCounterPrice(Math.round((rfq.target_price_per_unit + rfq.current_listing_price) / 2));
                                                        setIsCounterModalOpen(true);
                                                    }}
                                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                                >
                                                    🤝 Counter Offer
                                                </button>
                                                <button
                                                    onClick={() => mockStore.declineRfq(rfq.id, 'farmer', 'Farmer declined the target price.')}
                                                    className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}

                                        {rfq.status === 'buyer_countered' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => mockStore.acceptRfq(rfq.id, 'farmer')}
                                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                                    title="Accept buyer's revised counter offer"
                                                >
                                                    ✓ Accept ₹{rfq.history?.[rfq.history.length - 1]?.price}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRfqForCounter(rfq);
                                                        setCounterPrice(rfq.history?.[rfq.history.length - 1]?.price || rfq.target_price_per_unit);
                                                        setIsCounterModalOpen(true);
                                                    }}
                                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                                >
                                                    🤝 Counter Back
                                                </button>
                                                <button
                                                    onClick={() => mockStore.declineRfq(rfq.id, 'farmer', 'Farmer declined the counter offer.')}
                                                    className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}

                                        {rfq.status === 'counter_offered' && (
                                            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-200">
                                                ⏳ Counter Sent &bull; Awaiting Buyer Decision
                                            </span>
                                        )}

                                        {rfq.status === 'accepted' && (
                                            <button
                                                onClick={() => setActiveTab('orders')}
                                                className="px-3.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-xs font-bold border border-green-200 transition-all flex items-center gap-1"
                                            >
                                                ✓ Deal Confirmed &bull; View Order &rarr;
                                            </button>
                                        )}

                                        {rfq.status === 'declined' && (
                                            <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">
                                                ✕ Negotiation Closed
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs space-y-2">
                                    <p className="font-semibold text-gray-700">Negotiation Thread:</p>
                                    {rfq.history.map((msg, i) => (
                                        <div key={i} className={`p-2 rounded-lg ${msg.by === 'farmer' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 ml-4' : 'bg-white border border-gray-200 mr-4'}`}>
                                            <div className="flex justify-between font-bold text-[11px] mb-0.5">
                                                <span>{msg.by === 'farmer' ? '👨‍🌾 Your Counter' : `🏢 ${rfq.buyer_name}`}</span>
                                                <span className="text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-[11px]">{msg.message}</p>
                                            <p className="text-[10px] font-bold mt-1">Price Proposed: ₹{msg.price}/{rfq.unit}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 5. EARNINGS & SETTLEMENTS */}
            {activeTab === 'earnings' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Marketplace Sales</span>
                            <span className="text-3xl font-black text-gray-900 mt-2 block">
                                ₹{farmOrders.reduce((acc, o) => acc + o.total_amount, 0).toLocaleString()}
                            </span>
                            <span className="text-xs text-emerald-600 font-semibold mt-1 block">Across {farmOrders.length} completed transactions</span>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Escrow Balance (In Transit)</span>
                            <span className="text-3xl font-black text-amber-600 mt-2 block">
                                ₹{farmOrders.filter(o => o.status === 'dispatched' || o.status === 'ready_for_pickup').reduce((acc, o) => acc + o.total_amount, 0).toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500 mt-1 block">Released upon PIN verification / delivery</span>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Platform Commission Saved</span>
                            <span className="text-3xl font-black text-emerald-700 mt-2 block">0%</span>
                            <span className="text-xs text-emerald-600 font-semibold mt-1 block">Direct Farm Sales: 100% farmer retention</span>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 6. NURSERY SOURCING (SEEDS & SAPLINGS) */}
            {activeTab === 'nursery_sourcing' && (
                <div className="space-y-8">
                    <NurseryStorefrontView />
                    <div className="pt-8 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                    <span>🌱</span> Your Seedling Bookings & Pre-Order Lifecycle
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Track stage broadcasts from registered nurseries (Sown &rarr; Growing &rarr; Hardened &rarr; Ready)
                                </p>
                            </div>
                        </div>
                        <NurseryOrdersTab />
                    </div>
                </div>
            )}

            {/* ── MODAL 1: VERIFY 6-DIGIT PICKUP PIN ─────────────────────────── */}
            {isPinModalOpen && selectedOrderForPin && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 text-2xl flex items-center justify-center mx-auto mb-3 font-black">
                                🔑
                            </div>
                            <h3 className="text-xl font-extrabold text-gray-900">Verify Customer Pickup PIN</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Customer <strong>{selectedOrderForPin.customer_name}</strong> has arrived at farm gate. Ask them for their 6-digit order PIN.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-1">
                            <div className="flex justify-between text-amber-900 font-bold">
                                <span>Order: {selectedOrderForPin.order_number}</span>
                                <span>₹{selectedOrderForPin.total_amount}</span>
                            </div>
                            <p className="text-amber-700 text-[11px]">
                                Items: {selectedOrderForPin.items.map(i => `${i.title} (${i.quantity} ${i.unit})`).join(', ')}
                            </p>
                            <p className="text-[10px] text-amber-600 font-mono mt-2 bg-amber-100/70 p-1.5 rounded text-center">
                                (Demo hint: Expected PIN is <strong>{selectedOrderForPin.pickup_details?.pickup_code}</strong>)
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                                Enter 6-Digit PIN
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 482-910"
                                value={enteredPin}
                                onChange={(e) => {
                                    setEnteredPin(e.target.value);
                                    setPinError('');
                                }}
                                className="w-full text-center text-3xl font-black tracking-widest py-3 border-2 border-gray-300 rounded-2xl focus:border-emerald-500 focus:outline-none"
                            />
                            {pinError && (
                                <p className="text-xs font-bold text-red-600 mt-2 text-center">{pinError}</p>
                            )}
                            {pinSuccess && (
                                <p className="text-xs font-bold text-green-600 mt-2 text-center animate-bounce">
                                    ✓ PIN Verified! Handover Confirmed & Quantity Moved to Sold in Crop Inventory.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsPinModalOpen(false)}
                                className="flex-1 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerifyPin}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all"
                            >
                                Confirm Handover
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: DISPATCH B2B WHOLESALE ORDER (Requirement 4.b) ─────── */}
            {isB2BDispatchModalOpen && selectedOrderForB2B && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-800 text-2xl flex items-center justify-center mx-auto mb-3 font-black">
                                🚚
                            </div>
                            <h3 className="text-xl font-extrabold text-gray-900">Confirm Loaded & Dispatch B2B Truck</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Buyer: <strong>{selectedOrderForB2B.customer_name}</strong> &bull; Order: {selectedOrderForB2B.order_number}
                            </p>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs space-y-1.5">
                            <div className="flex justify-between font-bold text-indigo-900">
                                <span>Produce & Quantity</span>
                                <span>{selectedOrderForB2B.items.map(i => `${i.quantity} ${i.unit}`).join(', ')}</span>
                            </div>
                            <p className="text-indigo-700 text-[11px]">
                                Items: {selectedOrderForB2B.items.map(i => i.title).join(', ')}
                            </p>
                            <p className="text-indigo-800 font-semibold text-[11px] pt-1 border-t border-indigo-200">
                                Total Value: ₹{selectedOrderForB2B.total_amount?.toLocaleString()}
                            </p>
                            <div className="mt-2 p-2.5 bg-indigo-100/70 rounded-xl text-[11px] text-indigo-900 font-medium">
                                ℹ️ <strong>Rule 4.b</strong>: Confirming dispatch indicates produce is loaded on truck. This immediately updates the quantity to <strong>Sold</strong> in your Crop Inventory.
                            </div>
                        </div>

                        {b2bSuccess ? (
                            <p className="text-xs font-bold text-green-600 py-3 text-center animate-bounce">
                                ✓ Dispatched! Quantity moved to Sold in Crop Inventory.
                            </p>
                        ) : (
                            <div className="space-y-3 text-xs">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Vehicle / Truck Number *</label>
                                    <input
                                        type="text"
                                        value={b2bTruckNumber}
                                        onChange={(e) => setB2bTruckNumber(e.target.value)}
                                        placeholder="e.g. KA-04-E-5566"
                                        className="w-full p-2.5 border border-gray-300 rounded-xl font-bold uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">Driver Name & Contact *</label>
                                    <input
                                        type="text"
                                        value={b2bDriverName}
                                        onChange={(e) => setB2bDriverName(e.target.value)}
                                        placeholder="e.g. Ramesh Kumar (+91 98450 12345)"
                                        className="w-full p-2.5 border border-gray-300 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">E-Way Bill / Challan (Optional)</label>
                                    <input
                                        type="text"
                                        value={b2bChallanNumber}
                                        onChange={(e) => setB2bChallanNumber(e.target.value)}
                                        placeholder="e.g. EWB-2025-99881"
                                        className="w-full p-2.5 border border-gray-300 rounded-xl"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsB2BDispatchModalOpen(false)}
                                        className="flex-1 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDispatchB2B}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95"
                                    >
                                        Confirm & Dispatch
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── MODAL 2: DISPATCH DIRECT COURIER ─────────────────────────── */}
            {isCourierModalOpen && selectedOrderForCourier && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-lg">
                                🚚
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-lg">Dispatch Courier Order</h3>
                                <p className="text-xs text-gray-500">Order #{selectedOrderForCourier.order_number}</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Carrier Name</label>
                                <input
                                    type="text"
                                    value={carrierName}
                                    onChange={(e) => setCarrierName(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Tracking Number / AWB</label>
                                <input
                                    type="text"
                                    placeholder="e.g. PRTR-BLR-88912"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsCourierModalOpen(false)}
                                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDispatchCourier}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                            >
                                Mark Dispatched
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL 3: DISPATCH TO CENTRAL HUB ─────────────────────────── */}
            {isConsignmentModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                                🚚
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-lg">Consign Produce to Central Depot</h3>
                                <p className="text-xs text-gray-500">Produce will be weighed, QA-inspected, and stocked for consolidated orders</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateConsignment} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">Crop / Produce</label>
                                    <input
                                        type="text"
                                        required
                                        value={consignmentForm.crop_name}
                                        onChange={(e) => setConsignmentForm({ ...consignmentForm, crop_name: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">Declared Grade</label>
                                    <select
                                        value={consignmentForm.grade_declared}
                                        onChange={(e) => setConsignmentForm({ ...consignmentForm, grade_declared: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                    >
                                        <option value="Grade A">Grade A (Premium Table)</option>
                                        <option value="Grade B">Grade B (Processing)</option>
                                        <option value="Export Certified">Export Certified</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">Dispatch Quantity</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            required
                                            min="10"
                                            value={consignmentForm.dispatched_qty}
                                            onChange={(e) => setConsignmentForm({ ...consignmentForm, dispatched_qty: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                        />
                                        <span className="p-2.5 bg-gray-100 rounded-xl font-bold text-gray-600">kg</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">Target Price (₹/kg)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={consignmentForm.expected_price_per_unit}
                                        onChange={(e) => setConsignmentForm({ ...consignmentForm, expected_price_per_unit: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">Vehicle / Truck Number</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. KA-04-E-8821"
                                        value={consignmentForm.vehicle_number}
                                        onChange={(e) => setConsignmentForm({ ...consignmentForm, vehicle_number: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl font-medium uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-gray-700 block mb-1">Driver Name & Contact</label>
                                    <input
                                        type="text"
                                        placeholder="Driver Name"
                                        value={consignmentForm.driver_name}
                                        onChange={(e) => setConsignmentForm({ ...consignmentForm, driver_name: e.target.value })}
                                        className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsConsignmentModalOpen(false)}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                                >
                                    Confirm Dispatch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── MODAL 4: COUNTER OFFER ON RFQ ────────────────────────────── */}
            {isCounterModalOpen && selectedRfqForCounter && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-lg">
                                🤝
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-lg">Send Counter Offer</h3>
                                <p className="text-xs text-gray-500">To {selectedRfqForCounter.buyer_name}</p>
                            </div>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span>Requested Volume:</span>
                                <strong>{selectedRfqForCounter.requested_qty} {selectedRfqForCounter.unit}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span>Buyer Proposed:</span>
                                <strong className="text-indigo-900">₹{selectedRfqForCounter.target_price_per_unit}/{selectedRfqForCounter.unit}</strong>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Your Counter Price (₹/{selectedRfqForCounter.unit})</label>
                                <input
                                    type="number"
                                    required
                                    value={counterPrice}
                                    onChange={(e) => setCounterPrice(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-extrabold text-lg text-emerald-800"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 block mb-1">Terms / Message to Buyer</label>
                                <textarea
                                    rows="3"
                                    placeholder="e.g. Can do ₹33/kg with free labor loading into your reefer truck."
                                    value={counterMessage}
                                    onChange={(e) => setCounterMessage(e.target.value)}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsCounterModalOpen(false)}
                                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendCounter}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                            >
                                Send Counter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL 5: CREATE NEW LISTING ───────────────────────────────── */}
            {isCreateModalOpen && (
                <CreateListingModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => setIsCreateModalOpen(false)}
                />
            )}
        </div>
    );
}

// ── SUB-COMPONENT: CREATE LISTING MODAL ──────────────────────────────────────
function CreateListingModal({ onClose, onCreated }) {
    const crops = mockStore.getCrops();
    const [formData, setFormData] = useState({
        channel: 'direct', // 'direct' | 'hub_consignment' | 'b2b_bulk'
        title: '',
        category: 'Vegetables',
        variety: '',
        grade: 'Grade A',
        price_per_unit: 40,
        unit: 'kg',
        available_qty: 200,
        min_order_qty: 2,
        is_certified_organic: true,
        pickup_available: true,
        courier_available: true,
        description: '',
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
    });

    // Auto-fill from active crops
    const handleCropSelect = (cropId) => {
        const crop = crops.find(c => c.id === cropId);
        if (crop) {
            setFormData(prev => ({
                ...prev,
                crop_id: crop.id,
                title: `Farm-Fresh ${crop.name}`,
                variety: crop.variety || '',
                description: `Freshly harvested ${crop.name} (${crop.variety}) grown at Deccan Organic Farms.`,
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mockStore.createListing(formData);
        onCreated();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-900">List Produce for Sale</h3>
                        <p className="text-xs text-gray-500">Sell direct to consumers, consign to hub, or wholesale bulk</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    {/* Channel Selector */}
                    <div>
                        <label className="font-bold text-gray-700 block mb-1.5 uppercase tracking-wider text-[11px]">
                            Select Marketplace Channel
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, channel: 'direct', unit: 'kg', min_order_qty: 2 })}
                                className={`p-3 rounded-2xl border text-left transition-all ${
                                    formData.channel === 'direct'
                                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold shadow-sm'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                <span className="text-lg block mb-1">🛒</span>
                                <span className="block font-extrabold text-xs">Direct D2C</span>
                                <span className="text-[10px] text-gray-500 font-normal leading-tight block mt-0.5">Farm Pickup & Direct Courier</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, channel: 'hub_consignment', unit: 'kg', min_order_qty: 1, pickup_available: false, courier_available: true })}
                                className={`p-3 rounded-2xl border text-left transition-all ${
                                    formData.channel === 'hub_consignment'
                                        ? 'border-blue-500 bg-blue-50/50 text-blue-950 font-bold shadow-sm'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                <span className="text-lg block mb-1">🏢</span>
                                <span className="block font-extrabold text-xs">Central Hub</span>
                                <span className="text-[10px] text-gray-500 font-normal leading-tight block mt-0.5">Consign to Depot</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, channel: 'b2b_bulk', unit: 'Quintal (100 kg)', min_order_qty: 5, price_per_unit: 4200 })}
                                className={`p-3 rounded-2xl border text-left transition-all ${
                                    formData.channel === 'b2b_bulk'
                                        ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 font-bold shadow-sm'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                <span className="text-lg block mb-1">📦</span>
                                <span className="block font-extrabold text-xs">B2B Wholesale</span>
                                <span className="text-[10px] text-gray-500 font-normal leading-tight block mt-0.5">Bulk Crates & MOQ</span>
                            </button>
                        </div>
                    </div>

                    {/* Pre-fill from active crops */}
                    {crops.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                            <label className="font-bold text-gray-700 block mb-1">⚡ Auto-Fill from Farm Harvests:</label>
                            <select
                                onChange={(e) => handleCropSelect(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-xl bg-white font-medium"
                            >
                                <option value="">Select a planted crop...</option>
                                {crops.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.variety || 'Standard'})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Listing Title</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Organic Roma Tomatoes"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>

                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            >
                                <option value="Vegetables">Vegetables</option>
                                <option value="Fruits">Fruits</option>
                                <option value="Grains & Staples">Grains & Staples</option>
                                <option value="Spices & Herbs">Spices & Herbs</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Variety</label>
                            <input
                                type="text"
                                placeholder="e.g. Roma NS-592"
                                value={formData.variety}
                                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Quality Grade</label>
                            <select
                                value={formData.grade}
                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            >
                                <option value="Grade A">Grade A (Premium Table)</option>
                                <option value="Grade B">Grade B (Commercial / Processing)</option>
                                <option value="Export Certified">Export Certified</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Unit</label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            >
                                <option value="kg">Kilogram (kg)</option>
                                <option value="Crate (20 kg)">Crate (20 kg)</option>
                                <option value="Quintal (100 kg)">Quintal (100 kg)</option>
                                <option value="Box">Box</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Price per {formData.unit} (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.price_per_unit}
                                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-extrabold text-emerald-800"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Available Quantity</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.available_qty}
                                onChange={(e) => setFormData({ ...formData, available_qty: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>
                        <div>
                            <label className="font-bold text-gray-700 block mb-1">Min Order Qty (MOQ)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.min_order_qty}
                                onChange={(e) => setFormData({ ...formData, min_order_qty: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                            />
                        </div>
                    </div>

                    {/* Delivery options for D2C */}
                    {formData.channel === 'direct' && (
                        <div className="flex items-center gap-6 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                                <input
                                    type="checkbox"
                                    checked={formData.pickup_available}
                                    onChange={(e) => setFormData({ ...formData, pickup_available: e.target.checked })}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>🚜 Allow Farm Gate Pickup (Free)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                                <input
                                    type="checkbox"
                                    checked={formData.courier_available}
                                    onChange={(e) => setFormData({ ...formData, courier_available: e.target.checked })}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>🚚 Allow Courier Delivery</span>
                            </label>
                        </div>
                    )}

                    <div>
                        <label className="font-bold text-gray-700 block mb-1">Description & Story</label>
                        <textarea
                            rows="2"
                            placeholder="Describe freshness, farming practices, brix sweetness, or ideal culinary uses..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all hover:scale-[1.01]"
                        >
                            Publish Listing Live
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
