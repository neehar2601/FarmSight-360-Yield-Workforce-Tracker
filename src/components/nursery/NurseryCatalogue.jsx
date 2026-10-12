import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function NurseryCatalogue({ onOpenNewListingModal, onEditListing, onSelectListingForStageUpdate }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedType, setSelectedType] = useState('all'); // 'all' | 'in_stock' | 'pre_order'
    const [searchQuery, setSearchQuery] = useState('');

    const nursery = mockStore.getCurrentNursery();
    const listings = mockStore.getNurseryListings({
        category: selectedCategory,
        type: selectedType,
        nurseryId: nursery?.id,
        search: searchQuery,
    });

    const categories = ['All', 'Vegetable Seedlings', 'Fruit Plants / Grafts', 'Certified Seeds', 'Commercial Timber / Plantation'];

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
        sown: '2. Sown & Germinating',
        growing: '3. Growing in Polyhouse',
        collected: '4. Collected & Hardened',
        processed: '5. Processed & Crated',
        ready_available: '6. Ready for Collection',
    };

    return (
        <div className="space-y-6">
            {/* Top Bar with Filters & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    {/* In-Stock vs Pre-Order Filter */}
                    <div className="bg-gray-100 p-1 rounded-2xl flex items-center text-xs font-bold">
                        <button
                            onClick={() => setSelectedType('all')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                selectedType === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            All Offerings ({listings.length})
                        </button>
                        <button
                            onClick={() => setSelectedType('in_stock')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                                selectedType === 'in_stock' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <span>⚡</span> Readily Available
                        </button>
                        <button
                            onClick={() => setSelectedType('pre_order')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                                selectedType === 'pre_order' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <span>📅</span> Pre-Order Batches
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search plants, varieties, seeds..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 w-48 sm:w-60"
                        />
                        <span className="absolute left-2.5 top-2 text-xs text-gray-400">🔍</span>
                    </div>
                </div>

                <button
                    onClick={onOpenNewListingModal}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shrink-0"
                >
                    <span>+</span> List New Seed / Plant Batch
                </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                            selectedCategory === cat
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid of Listings */}
            {listings.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
                    <span className="text-5xl block">🌱</span>
                    <h3 className="font-black text-gray-900 text-base">No Nursery Offerings Match Filter</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Add a new readily available plant listing or announce an upcoming pre-order seedling batch.
                    </p>
                    <button
                        onClick={onOpenNewListingModal}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                        + List Plant / Seed Batch &rarr;
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((item) => {
                        const isPreOrder = item.availability_type === 'pre_order';
                        const progressPercentage = isPreOrder && item.batch_capacity
                            ? Math.min(100, Math.round(((item.pre_ordered_qty || 0) / item.batch_capacity) * 100))
                            : null;

                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {/* Image & Badges */}
                                    <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                        />

                                        {/* Availability State Badge */}
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                            {isPreOrder ? (
                                                <span className="px-2.5 py-1 bg-indigo-900/90 text-white text-[10px] font-black uppercase tracking-wider rounded-lg backdrop-blur flex items-center gap-1 shadow-sm">
                                                    <span>📅</span> Pre-Order ({item.advance_percentage || 20}% Advance)
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-emerald-900/90 text-white text-[10px] font-black uppercase tracking-wider rounded-lg backdrop-blur flex items-center gap-1 shadow-sm">
                                                    <span>⚡</span> Readily Available
                                                </span>
                                            )}
                                            {item.reserved_for_farm !== undefined && item.reserved_for_farm > 0 && (
                                                <span className="px-2 py-1 bg-lime-900/90 text-lime-200 text-[10px] font-black uppercase tracking-wider rounded-lg backdrop-blur flex items-center gap-1 shadow-sm">
                                                    <span>🏡</span> Farm: {item.reserved_for_farm}
                                                </span>
                                            )}
                                        </div>

                                        {/* Category Badge */}
                                        <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded-md backdrop-blur">
                                            {item.category}
                                        </span>

                                        {/* Current Stage Badge if Pre-Order */}
                                        {isPreOrder && item.current_stage && (
                                            <span className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border shadow-sm backdrop-blur ${stageColors[item.current_stage] || 'bg-gray-100 text-gray-800'}`}>
                                                {stageLabels[item.current_stage] || item.current_stage}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 space-y-3">
                                        <div>
                                            <h4 className="font-black text-gray-900 text-sm leading-snug">{item.title}</h4>
                                            {item.variety && (
                                                <span className="text-[11px] text-gray-500 font-medium block">
                                                    Variety: <strong>{item.variety}</strong>
                                                </span>
                                            )}
                                        </div>

                                        {/* Specs Grid */}
                                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                            <div>
                                                <span className="text-gray-400 block text-[10px] uppercase font-bold">Germination</span>
                                                <span className="font-extrabold text-gray-800">{item.specs?.germination_rate || '98% Guarantee'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block text-[10px] uppercase font-bold">Age / Plug</span>
                                                <span className="font-extrabold text-gray-800">{item.specs?.seedling_age || '25-Day Plug'}</span>
                                            </div>
                                        </div>

                                        {/* Stock / Batch Progress Details */}
                                        {isPreOrder ? (
                                            <div className="space-y-1.5 text-xs bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100">
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-indigo-900 font-bold">Batch Booking Progress:</span>
                                                    <span className="font-black text-indigo-950">
                                                        {item.pre_ordered_qty || 0} / {item.batch_capacity || 500} {item.unit} booked ({progressPercentage}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${progressPercentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-indigo-800 pt-0.5">
                                                    <span>Target Ready: <strong>{item.ready_by_date || 'In 3 Weeks'}</strong></span>
                                                    <span>Min Order: <strong>{item.min_order_qty} {item.unit}</strong></span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center text-xs bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                                                <span className="text-emerald-900 font-bold">Immediate Stock Available:</span>
                                                <span className="font-black text-emerald-950 text-sm">
                                                    {item.stock_qty || 0} {item.unit}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer: Price & Actions */}
                                <div className="p-5 pt-0 border-t border-gray-100 mt-2 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Nursery Price</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-black text-emerald-800">₹{item.unit_price.toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-500 font-medium">/ {item.unit}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {isPreOrder && (
                                            <button
                                                onClick={() => onSelectListingForStageUpdate(item)}
                                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
                                                title="Advance seedling stage (Growing -> Collected -> Ready)"
                                            >
                                                <span>🔄</span> Update Growth Stage
                                            </button>
                                        )}

                                        <button
                                            onClick={() => onEditListing && onEditListing(item)}
                                            className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                                            title="Edit batch details & quota"
                                        >
                                            <span>✏️</span> Edit
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Delete listing "${item.title}"?`)) {
                                                    mockStore.deleteNurseryListing(item.id);
                                                }
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-xs"
                                            title="Delete listing"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
