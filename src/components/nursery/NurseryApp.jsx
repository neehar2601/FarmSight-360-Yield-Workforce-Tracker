import React, { useState, useEffect } from 'react';
import { mockStore } from '../../mock/mockStore';
import NurseryCatalogue from './NurseryCatalogue';
import NurseryPreOrderPipeline from './NurseryPreOrderPipeline';
import NurseryOrdersView from './NurseryOrdersView';
import NurseryProfileView from './NurseryProfileView';
import NurseryListingModal from './NurseryListingModal';
import NurseryStageUpdateModal from './NurseryStageUpdateModal';
import NurseryRegisterModal from './NurseryRegisterModal';

export default function NurseryApp() {
    const [activeTab, setActiveTab] = useState('catalogue'); // 'catalogue' | 'pipeline' | 'orders' | 'profile'
    const [, setTick] = useState(0);

    // Modals
    const [isListingModalOpen, setIsListingModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState(null);
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [targetItemForStage, setTargetItemForStage] = useState(null);
    const [isOrderStage, setIsOrderStage] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    useEffect(() => {
        const unsub = mockStore.subscribe(() => {
            setTick((t) => t + 1);
        });
        return unsub;
    }, []);

    const nursery = mockStore.getCurrentNursery();
    const allListings = mockStore.getNurseryListings({ nurseryId: nursery?.id });
    const inStockCount = allListings.filter((l) => l.availability_type === 'in_stock').length;
    const preOrderBatches = allListings.filter((l) => l.availability_type === 'pre_order').length;
    const orders = mockStore.getNurseryOrders({ nurseryId: nursery?.id });
    const pendingOrdersCount = orders.filter((o) => o.status !== 'completed').length;
    const readyForPickupCount = orders.filter((o) => o.status === 'ready_for_pickup' || o.status === 'ready_for_dispatch').length;

    const handleOpenNewListing = () => {
        setEditingListing(null);
        setIsListingModalOpen(true);
    };

    const handleOpenEditListing = (listing) => {
        setEditingListing(listing);
        setIsListingModalOpen(true);
    };

    const handleSelectListingForStageUpdate = (item, isOrder = false) => {
        setTargetItemForStage(item);
        setIsOrderStage(isOrder);
        setIsStageModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-lime-50/20 to-gray-50 text-gray-900 pb-20">
            {/* Top Nursery Portal Header Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-gray-950 text-white border-b border-emerald-900/40 relative overflow-hidden">
                {/* Background decorative glow */}
                <div className="absolute -right-16 -top-16 w-80 h-80 bg-lime-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute left-1/3 -bottom-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10 space-y-6">
                    {/* Top row: Entity Title, Badges & Action */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-1 bg-lime-500/20 border border-lime-400/40 text-lime-300 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
                                    Certified Propagation Facility
                                </span>
                                <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-full text-[11px] font-bold">
                                    ⭐ NHB 4-Star Accreditation
                                </span>
                                <span className="px-2.5 py-1 bg-gray-800/80 border border-gray-700 text-gray-300 rounded-full text-[11px] font-mono">
                                    Lic: {nursery?.license_number || 'NUR-KA-2024-5519'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-3xl sm:text-4xl">🌱</span>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                                        {nursery?.name || 'Sunrise Agro & Horticultural Nursery'}
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-300 flex items-center gap-2">
                                        <span>📍 {nursery?.address?.district || 'Hoskote, Bengaluru Rural'}</span>
                                        <span>&bull;</span>
                                        <span>Operator: <strong className="text-white">{nursery?.operator_name || 'Anand Rao'}</strong></span>
                                        <span>&bull;</span>
                                        <span className="text-lime-300 font-bold">Capacity: {nursery?.monthly_capacity || '1.5 Lakh Seedlings/Mo'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Top Action buttons */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={handleOpenNewListing}
                                className="px-5 py-3 bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-gray-950 font-black rounded-2xl shadow-lg shadow-emerald-950/50 hover:shadow-lime-500/30 transition-all flex items-center gap-2 text-xs sm:text-sm active:scale-95"
                            >
                                <span className="text-base font-black">+</span>
                                <span>List Seeds or Plant Batches</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick KPI Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-3 backdrop-blur-sm">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Catalogue</div>
                            <div className="text-xl font-black text-white mt-0.5">{allListings.length} Products</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">Seeds & Seedlings</div>
                        </div>

                        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 backdrop-blur-sm">
                            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Readily Available</div>
                            <div className="text-xl font-black text-emerald-300 mt-0.5">{inStockCount} Varieties</div>
                            <div className="text-[10px] text-emerald-400/80 mt-0.5">Instant Pickup / Courier</div>
                        </div>

                        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3 backdrop-blur-sm">
                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Pre-Order Batches</div>
                            <div className="text-xl font-black text-indigo-300 mt-0.5">{preOrderBatches} Active</div>
                            <div className="text-[10px] text-indigo-300/80 mt-0.5">6-Stage Lifecycle Tracking</div>
                        </div>

                        <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-3 backdrop-blur-sm">
                            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Fulfillment Queue</div>
                            <div className="text-xl font-black text-purple-300 mt-0.5 flex items-center gap-2">
                                <span>{pendingOrdersCount} Pending</span>
                                {readyForPickupCount > 0 && (
                                    <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                                        {readyForPickupCount} Ready
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] text-purple-300/80 mt-0.5">PIN & Dispatch Verification</div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-t border-gray-800/80 pt-4 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('catalogue')}
                            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === 'catalogue'
                                    ? 'bg-lime-500 text-gray-950 font-black shadow-md'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-900/60'
                            }`}
                        >
                            <span>🌿</span>
                            <span>Catalogue & Stock</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-black/20">
                                {allListings.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('pipeline')}
                            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === 'pipeline'
                                    ? 'bg-indigo-600 text-white font-black shadow-md'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-900/60'
                            }`}
                        >
                            <span>📈</span>
                            <span>Propagation Pipeline</span>
                            {preOrderBatches > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-white/20">
                                    {preOrderBatches} batches
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === 'orders'
                                    ? 'bg-purple-600 text-white font-black shadow-md'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-900/60'
                            }`}
                        >
                            <span>📦</span>
                            <span>Orders & Handover</span>
                            {pendingOrdersCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-white/20">
                                    {pendingOrdersCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeTab === 'profile'
                                    ? 'bg-emerald-600 text-white font-black shadow-md'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-900/60'
                            }`}
                        >
                            <span>📜</span>
                            <span>Facility & Licensing</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {activeTab === 'catalogue' && (
                    <NurseryCatalogue
                        onOpenNewListingModal={handleOpenNewListing}
                        onEditListing={handleOpenEditListing}
                        onSelectListingForStageUpdate={(listing) => handleSelectListingForStageUpdate(listing, false)}
                    />
                )}

                {activeTab === 'pipeline' && (
                    <NurseryPreOrderPipeline
                        onSelectForStageUpdate={(item, isOrder) => handleSelectListingForStageUpdate(item, isOrder)}
                    />
                )}

                {activeTab === 'orders' && (
                    <NurseryOrdersView />
                )}

                {activeTab === 'profile' && (
                    <NurseryProfileView
                        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                    />
                )}
            </div>

            {/* Modals */}
            <NurseryListingModal
                isOpen={isListingModalOpen}
                onClose={() => {
                    setIsListingModalOpen(false);
                    setEditingListing(null);
                }}
                editListing={editingListing}
                onListingCreated={() => {
                    setIsListingModalOpen(false);
                    setEditingListing(null);
                }}
            />

            <NurseryStageUpdateModal
                isOpen={isStageModalOpen}
                onClose={() => {
                    setIsStageModalOpen(false);
                    setTargetItemForStage(null);
                }}
                targetItem={targetItemForStage}
                isOrder={isOrderStage}
                onUpdated={() => {
                    setIsStageModalOpen(false);
                    setTargetItemForStage(null);
                }}
            />

            <NurseryRegisterModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onRegistered={() => setIsRegisterModalOpen(false)}
            />
        </div>
    );
}
