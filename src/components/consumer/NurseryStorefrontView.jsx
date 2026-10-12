import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';
import NurseryBookingModal from './NurseryBookingModal';

export default function NurseryStorefrontView({ onOpenOrders, onSelectListing }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedType, setSelectedType] = useState('all'); // 'all' | 'in_stock' | 'pre_order'
    const [searchQuery, setSearchQuery] = useState('');
    const [bookingListing, setBookingListing] = useState(null);
    const [bookingSuccessOrder, setBookingSuccessOrder] = useState(null);

    const categories = ['All', 'Vegetable Seedlings', 'Fruit Plants / Grafts', 'Certified Seeds', 'Commercial Timber / Plantation'];

    const listings = mockStore.getNurseryListings({
        category: selectedCategory,
        type: selectedType,
        search: searchQuery,
    });

    const nurseries = mockStore.getNurseryVendors();
    const primaryNursery = nurseries[0];

    const stageColors = {
        booked: 'bg-gray-100 text-gray-800 border-gray-300',
        sown: 'bg-amber-100 text-amber-900 border-amber-300',
        growing: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        collected: 'bg-teal-100 text-teal-900 border-teal-300',
        processed: 'bg-blue-100 text-blue-900 border-blue-300',
        ready_available: 'bg-purple-100 text-purple-900 border-purple-300',
    };

    const stageLabels = {
        booked: '1. Booked',
        sown: '2. Sown (Mist Chamber)',
        growing: '3. Growing (Polyhouse)',
        collected: '4. Hardened (Sunyard)',
        processed: '5. Graded & Crated',
        ready_available: '6. Ready for Handover',
    };

    const handleOrderPlaced = (order) => {
        setBookingSuccessOrder(order);
    };

    return (
        <div className="space-y-6">
            {/* Top Showcase Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-lime-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-lime-400/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-lime-400/20 border border-lime-300/40 text-lime-300 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur">
                                🌱 Certified High-Yield Propagation
                            </span>
                            <span className="px-3 py-1 bg-emerald-400/20 border border-emerald-300/40 text-emerald-300 rounded-full text-xs font-bold">
                                ⭐ NHB & ICAR Accredited Nurseries
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                            Certified Seedlings, Grafts & F1 Hybrid Seeds
                        </h2>
                        <p className="text-xs sm:text-sm text-lime-100/80 leading-relaxed">
                            Source disease-resistant plug seedlings raised in climate-controlled polyhouses. Order readily available stock for immediate delivery, or book upcoming batches with a <strong>20% advance milestone deposit</strong> and track 6 growth stages directly on your phone.
                        </p>
                    </div>

                    {primaryNursery && (
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-xs space-y-2 min-w-[260px]">
                            <div className="text-[10px] text-lime-300 font-bold uppercase tracking-wider">Featured Nursery Partner</div>
                            <div className="font-extrabold text-white text-sm">{primaryNursery.name}</div>
                            <div className="text-gray-300 text-[11px]">📍 {primaryNursery.address?.district}, Karnataka</div>
                            <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-[11px]">
                                <span className="text-lime-300 font-bold">1.5 Lakh</span>
                                <span className="text-gray-300">monthly plug capacity</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Banner if order placed */}
            {bookingSuccessOrder && (
                <div className="bg-emerald-900 text-white rounded-3xl p-5 border border-emerald-500 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🎉</span>
                        <div>
                            <h4 className="font-black text-sm">
                                Booking Confirmed! Order #{bookingSuccessOrder.order_number}
                            </h4>
                            <p className="text-xs text-emerald-200 mt-0.5">
                                {bookingSuccessOrder.is_pre_order
                                    ? `20% advance deposit received. Batch status: ${stageLabels[bookingSuccessOrder.current_stage] || bookingSuccessOrder.current_stage}. You can track updates under Plant & Seed Orders.`
                                    : `Readily available stock order placed! Method: ${bookingSuccessOrder.fulfillment_type === 'nursery_pickup' ? 'Nursery Pickup (PIN Ready)' : 'Nursery Freight Delivery'}.`
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setBookingSuccessOrder(null);
                                if (onOpenOrders) onOpenOrders();
                            }}
                            className="px-4 py-2 bg-white text-emerald-950 font-black rounded-xl text-xs hover:bg-emerald-100 transition-all shadow-sm"
                        >
                            View Order & Growth Stepper &rarr;
                        </button>
                        <button
                            onClick={() => setBookingSuccessOrder(null)}
                            className="px-3 py-2 text-emerald-300 hover:text-white font-bold text-xs"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Search, Filter Tabs & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    {/* In-Stock vs Pre-Order Filter */}
                    <div className="bg-gray-100 p-1 rounded-2xl flex items-center text-xs font-bold">
                        <button
                            onClick={() => setSelectedType('all')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                selectedType === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            All ({listings.length})
                        </button>
                        <button
                            onClick={() => setSelectedType('in_stock')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                selectedType === 'in_stock' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <span>⚡</span> Readily Available (In-Stock)
                        </button>
                        <button
                            onClick={() => setSelectedType('pre_order')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                selectedType === 'pre_order' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <span>🌱</span> Pre-Order Batches (20% Advance)
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search tomato plugs, mango grafts, marigold seeds..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3.5 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 w-full sm:w-64"
                    />
                </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            selectedCategory === cat
                                ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Listings Grid */}
            {listings.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
                    <span className="text-4xl block">🌱</span>
                    <h3 className="font-extrabold text-base text-gray-900">No Nursery Offerings Found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        No plants or seeds match your current filter criteria. Try clearing search or selecting another category.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((item) => {
                        const isPreOrder = item.availability_type === 'pre_order';
                        const unitPrice = parseFloat(item.unit_price) || 0;
                        const advanceAmount = isPreOrder ? Math.round((unitPrice * (item.advance_percentage || 20)) / 100) : null;

                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                            >
                                {/* Image Container */}
                                <div className="relative h-48 bg-gray-100 overflow-hidden">
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />

                                    {/* Availability Badge */}
                                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${
                                            isPreOrder
                                                ? 'bg-indigo-900/90 text-indigo-100 border border-indigo-400/30'
                                                : 'bg-emerald-900/90 text-emerald-100 border border-emerald-400/30'
                                        }`}>
                                            {isPreOrder ? '🌱 Advance Pre-Order' : '⚡ Readily Available'}
                                        </span>

                                        {isPreOrder && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${stageColors[item.current_stage] || 'bg-white text-gray-800'}`}>
                                                {stageLabels[item.current_stage] || item.current_stage}
                                            </span>
                                        )}
                                    </div>

                                    {/* Category Pill */}
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2.5 py-1 bg-black/60 text-white rounded-full text-[10px] font-bold backdrop-blur-sm">
                                            {item.category}
                                        </span>
                                    </div>

                                    {/* Readiness Date Badge */}
                                    {isPreOrder && item.ready_by_date && (
                                        <div className="absolute bottom-3 left-3 right-3 bg-indigo-950/90 text-white text-[11px] px-3 py-1.5 rounded-xl border border-indigo-500/40 backdrop-blur-sm flex items-center justify-between">
                                            <span className="text-indigo-300">Target Readiness:</span>
                                            <span className="font-bold">{item.ready_by_date}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                                            <span className="font-semibold">{item.variety}</span>
                                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                                                <span>✓</span> Verified Nursery
                                            </span>
                                        </div>

                                        <h3 className="font-black text-gray-900 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                                            {item.title}
                                        </h3>

                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                            {item.description}
                                        </p>

                                        {/* Specs Row */}
                                        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                                            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                                <span className="text-gray-400 block text-[10px]">Cavity / Age</span>
                                                <span className="font-bold text-gray-800">{item.specs?.seedling_age || '25-Day Plug'}</span>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                                                <span className="text-gray-400 block text-[10px]">Germination Rate</span>
                                                <span className="font-bold text-emerald-700">{item.specs?.germination_rate || '98%'}</span>
                                            </div>
                                        </div>

                                        {/* Nursery Name */}
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
                                            <span>🏡</span>
                                            <span className="font-medium">{item.nursery_name}</span>
                                        </div>
                                    </div>

                                    {/* Pricing & CTA */}
                                    <div className="pt-3 border-t border-gray-100 space-y-3">
                                        <div className="flex items-baseline justify-between">
                                            <div>
                                                <span className="text-xl font-black text-gray-900">
                                                    ₹{unitPrice.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium ml-1">
                                                    / {item.unit}
                                                </span>
                                            </div>

                                            {isPreOrder && (
                                                <div className="text-right">
                                                    <span className="text-[10px] text-indigo-600 font-bold block">
                                                        20% Advance Token
                                                    </span>
                                                    <span className="text-xs font-black text-indigo-900">
                                                        ₹{advanceAmount?.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setBookingListing(item)}
                                            className={`w-full py-3 rounded-2xl font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                                                isPreOrder
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
                                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                                            }`}
                                        >
                                            <span>{isPreOrder ? '🌱' : '🛒'}</span>
                                            <span>{isPreOrder ? 'Book Batch (20% Advance)' : 'Buy Readily Available'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Booking Modal */}
            <NurseryBookingModal
                isOpen={Boolean(bookingListing)}
                listing={bookingListing}
                onClose={() => setBookingListing(null)}
                onOrderPlaced={handleOrderPlaced}
            />
        </div>
    );
}
