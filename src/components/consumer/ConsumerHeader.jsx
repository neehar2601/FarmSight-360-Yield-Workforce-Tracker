import React from 'react';
import { mockStore } from '../../mock/mockStore';

export default function ConsumerHeader({
    activeMode,
    setActiveMode,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    cartItemCount,
    onOpenCart,
    onOpenOrders,
    onOpenQuotes,
    onOpenAuth,
    activeOrdersCount,
    pendingCountersCount = 0,
    userRfqsCount = 0,
}) {
    const user = mockStore.getCurrentUser();
    const isRetailUser = user?.role === 'customer';
    const isB2BUser = user?.role === 'b2b_buyer';

    const categories = ['All', 'Vegetables', 'Fruits', 'Grains & Staples'];

    return (
        <header className="bg-white border-b border-gray-200 sticky top-12 z-30 shadow-sm">
            {/* Main Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Logo & Mode Switcher */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🌱</span>
                        <div>
                            <span className="text-xl font-black text-gray-900 tracking-tight block leading-none">
                                farm360 <span className="text-emerald-700">Market</span>
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
                                Direct Farm & Wholesale
                            </span>
                        </div>
                    </div>

                    {/* Mode Toggle: Retail vs Wholesale vs Nursery */}
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-bold ml-2 flex-wrap gap-1">
                        <button
                            onClick={() => setActiveMode('retail')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                activeMode === 'retail'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <span>🛒</span> Retail Fresh
                        </button>
                        <button
                            onClick={() => setActiveMode('wholesale')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                activeMode === 'wholesale'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <span>🏢</span> B2B Wholesale
                        </button>
                        <button
                            onClick={() => setActiveMode('nursery')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                activeMode === 'nursery'
                                    ? 'bg-lime-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <span>🌱</span> Nursery & Seeds
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm">
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="Search tomatoes, bananas, rice, organic farms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Account & Cart Controls */}
                <div className="flex items-center gap-3">
                    {/* User status */}
                    {user && (user.role === 'customer' || user.role === 'b2b_buyer') ? (
                        <div
                            onClick={onOpenAuth}
                            className="flex items-center gap-2 cursor-pointer p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
                        >
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-8 h-8 rounded-lg object-cover"
                            />
                            <div className="text-left text-xs">
                                <span className="font-bold text-gray-900 block leading-tight">
                                    {isB2BUser ? user.b2b_profile?.company_name || user.name : user.name}
                                </span>
                                <span className={`text-[10px] font-semibold ${isB2BUser ? 'text-indigo-700' : 'text-emerald-700'}`}>
                                    {isB2BUser ? '🏢 B2B Verified' : '👤 Retail Shopper'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                            <span>👤</span> Sign In / Register
                        </button>
                    )}

                    {/* Wholesale Quotes / Deals Button */}
                    <button
                        onClick={onOpenQuotes}
                        className={`p-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 relative transition-all ${
                            pendingCountersCount > 0
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm ring-2 ring-indigo-400 ring-offset-1 animate-pulse'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        title="Wholesale Price Requests & Counter Offers"
                    >
                        <span>💬</span> <span className="hidden sm:inline">Quotes & Deals</span>
                        {pendingCountersCount > 0 ? (
                            <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-black flex items-center gap-0.5">
                                <span>🔔</span> {pendingCountersCount} Counter{pendingCountersCount > 1 ? 's' : ''}
                            </span>
                        ) : userRfqsCount > 0 ? (
                            <span className="w-4 h-4 bg-gray-200 text-gray-700 rounded-full text-[10px] flex items-center justify-center font-bold">
                                {userRfqsCount}
                            </span>
                        ) : null}
                    </button>

                    {/* Orders Button */}
                    <button
                        onClick={onOpenOrders}
                        className="p-2 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 relative transition-all"
                    >
                        <span>📦</span> <span className="hidden sm:inline">My Orders</span>
                        {activeOrdersCount > 0 && (
                            <span className="w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                                {activeOrdersCount}
                            </span>
                        )}
                    </button>

                    {/* Cart Button */}
                    <button
                        onClick={onOpenCart}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 relative"
                    >
                        <span>🛍️</span>
                        <span>Cart</span>
                        <span className="bg-white text-emerald-800 rounded-full px-1.5 py-0.2 text-[11px] font-black">
                            {cartItemCount}
                        </span>
                    </button>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-2 shrink-0">
                    Categories:
                </span>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                            selectedCategory === cat
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </header>
    );
}
