import React, { useState, useEffect } from 'react';
import { mockStore } from '../../mock/mockStore';
import ConsumerHeader from './ConsumerHeader';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import OrderSuccessModal from './OrderSuccessModal';
import ConsumerOrdersView from './ConsumerOrdersView';
import AuthModal from './AuthModal';
import B2BQuoteModal from './B2BQuoteModal';

export default function ConsumerApp() {
    const [activeMode, setActiveMode] = useState('retail'); // 'retail' | 'wholesale'
    const [activeChannel, setActiveChannel] = useState('all'); // 'all' | 'direct' | 'hub_consignment' | 'b2b_bulk'
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [, setTick] = useState(0);

    // Modals & Drawers state
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authDefaultTab, setAuthDefaultTab] = useState('retail');
    const [isOrdersViewOpen, setIsOrdersViewOpen] = useState(false);
    const [ordersInitialTab, setOrdersInitialTab] = useState('orders');

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProductForRfq, setSelectedProductForRfq] = useState(null);
    const [confirmedOrder, setConfirmedOrder] = useState(null);

    // Shopping Cart State with Browser Storage Persistence
    const CART_STORAGE_KEY = 'farm360_consumer_cart_v3';
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.warn('Failed to load cart from browser cache:', e);
        }
        return [];
    });

    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (e) {
            console.warn('Failed to save cart to browser cache:', e);
        }
    }, [cart]);

    // Listen to mockStore updates
    useEffect(() => {
        const unsub = mockStore.subscribe(() => setTick(t => t + 1));
        return unsub;
    }, []);

    // Filter listings strictly enforcing rules:
    // When customer is D2C (retail mode), B2B listings should NOT be visible under any circumstance.
    // Allowed retail channels: Farm Pickup, Courier, or Central Hub consignment
    let filteredListings = mockStore.getListings({
        category: selectedCategory === 'All' ? null : selectedCategory,
        search: searchQuery,
    });

    if (activeMode === 'wholesale') {
        filteredListings = filteredListings.filter(l => l.channel === 'b2b_bulk');
    } else {
        // D2C Retail: Never display b2b_bulk
        filteredListings = filteredListings.filter(l => l.channel !== 'b2b_bulk');

        if (activeChannel === 'farm_pickup') {
            filteredListings = filteredListings.filter(l => l.pickup_available);
        } else if (activeChannel === 'courier') {
            filteredListings = filteredListings.filter(l => l.courier_available);
        } else if (activeChannel === 'hub_consignment') {
            filteredListings = filteredListings.filter(l => l.channel === 'hub_consignment');
        }
    }

    const listings = filteredListings;

    const user = mockStore.getCurrentUser();
    const userOrders = mockStore.getOrders({ customerId: user?.id });
    const activeOrdersCount = userOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
    const userRfqs = mockStore.getRfqs({ buyerId: user?.id });
    const pendingCountersCount = userRfqs.filter(r => r.status === 'counter_offered').length;

    const handleOpenOrders = () => {
        setOrdersInitialTab('orders');
        setIsOrdersViewOpen(true);
    };

    const handleOpenQuotes = () => {
        setOrdersInitialTab('quotes');
        setIsOrdersViewOpen(true);
    };

    // Cart Handlers
    const handleAddToCart = (listing, qty = 1, fulfillment = null) => {
        const defaultFulfillment = fulfillment || (listing.pickup_available ? 'farm_pickup' : (listing.courier_available ? 'direct_courier' : 'hub_delivery'));
        setCart(prev => {
            const existingIdx = prev.findIndex(i => i.listing_id === listing.id);
            if (existingIdx > -1) {
                const next = [...prev];
                next[existingIdx].quantity += qty;
                if (fulfillment) next[existingIdx].fulfillment_type = fulfillment;
                return next;
            }
            return [
                ...prev,
                {
                    listing_id: listing.id,
                    title: listing.title,
                    farm_name: listing.farm_name,
                    grade: listing.grade,
                    quantity: qty,
                    unit: listing.unit,
                    unit_price: listing.price_per_unit,
                    channel: listing.channel,
                    pickup_available: listing.pickup_available,
                    courier_available: listing.courier_available,
                    fulfillment_type: defaultFulfillment,
                },
            ];
        });
        setIsCartOpen(true);
    };

    const handleUpdateQuantity = (listingId, newQty) => {
        setCart(prev => prev.map(item => item.listing_id === listingId ? { ...item, quantity: newQty } : item));
    };

    const handleUpdateFulfillment = (listingId, fulfillmentType) => {
        setCart(prev => prev.map(item => item.listing_id === listingId ? { ...item, fulfillment_type: fulfillmentType } : item));
    };

    const handleRemoveItem = (listingId) => {
        setCart(prev => prev.filter(item => item.listing_id !== listingId));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Storefront Header */}
            <ConsumerHeader
                activeMode={activeMode}
                setActiveMode={(mode) => {
                    setActiveMode(mode);
                    setActiveChannel('all');
                }}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                cartItemCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
                onOpenCart={() => setIsCartOpen(true)}
                onOpenOrders={handleOpenOrders}
                onOpenQuotes={handleOpenQuotes}
                onOpenAuth={() => {
                    setAuthDefaultTab(activeMode === 'wholesale' ? 'b2b' : 'retail');
                    setIsAuthOpen(true);
                }}
                activeOrdersCount={activeOrdersCount}
                pendingCountersCount={pendingCountersCount}
                userRfqsCount={userRfqs.length}
            />

            {/* MAIN STORE BODY OR ORDERS VIEW */}
            {isOrdersViewOpen ? (
                <ConsumerOrdersView
                    onBackToShopping={() => setIsOrdersViewOpen(false)}
                    initialTab={ordersInitialTab}
                />
            ) : (
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
                    {/* Hero Showcase Banner */}
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-950 p-6 md:p-10 text-white shadow-xl">
                        <div className="relative z-10 max-w-2xl space-y-3">
                            <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur">
                                {activeMode === 'wholesale' ? '🏭 Verified Commercial Sourcing' : '🌿 Fresh From The Farm Gate'}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                                {activeMode === 'wholesale'
                                    ? 'Procure Direct in Bulk with Volume Tiers & RFQs'
                                    : 'Taste Real Harvest Freshness at Fair Farm Prices'}
                            </h1>
                            <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
                                {activeMode === 'wholesale'
                                    ? 'Connect directly with certified growers for supermarkets, restaurants, and aggregators. Transact in crates and quintals with transparent commercial terms.'
                                    : 'Choose free Farm Gate Pickup or doorstep Courier with verification PINs, or order next-day consolidated produce backed by farm360 Central Hub inspection.'}
                            </p>
                        </div>

                        {/* Quick Channel Filter Tabs for Retail D2C Customers */}
                        {activeMode === 'retail' && (
                            <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-emerald-700/50">
                                <span className="text-xs text-emerald-200 font-bold mr-2">Options:</span>
                                <button
                                    onClick={() => setActiveChannel('all')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        activeChannel === 'all'
                                            ? 'bg-white text-emerald-950 shadow-md'
                                            : 'bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100'
                                    }`}
                                >
                                    All Direct & Hub Options
                                </button>
                                <button
                                    onClick={() => setActiveChannel('farm_pickup')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        activeChannel === 'farm_pickup'
                                            ? 'bg-white text-emerald-950 shadow-md'
                                            : 'bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100'
                                    }`}
                                >
                                    <span>🚜</span> Farm Gate Pickup
                                </button>
                                <button
                                    onClick={() => setActiveChannel('courier')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        activeChannel === 'courier'
                                            ? 'bg-white text-emerald-950 shadow-md'
                                            : 'bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100'
                                    }`}
                                >
                                    <span>🚚</span> Doorstep Courier
                                </button>
                                <button
                                    onClick={() => setActiveChannel('hub_consignment')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        activeChannel === 'hub_consignment'
                                            ? 'bg-white text-emerald-950 shadow-md'
                                            : 'bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100'
                                    }`}
                                >
                                    <span>🛡️</span> farm360 Central Hub
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Product Catalog Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {activeMode === 'wholesale' ? 'Wholesale Lots & Contract Produce' : 'Available Harvest Offerings'}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {listings.length} items available direct from verified farmers
                                </p>
                            </div>
                        </div>

                        {listings.length === 0 ? (
                            mockStore.getListings().length === 0 ? (
                                <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 text-gray-600 space-y-4 max-w-xl mx-auto my-8 shadow-sm">
                                    <span className="text-5xl block">🌱</span>
                                    <h3 className="text-xl font-black text-gray-900">No Produce Listed Yet</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        The marketplace has been initialized to a clean slate. Switch to the <strong>Farmer App</strong> to list freshly harvested crops or consign produce!
                                    </p>
                                    <button
                                        onClick={() => mockStore.setActiveRole('farmer')}
                                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
                                    >
                                        <span>👨‍🌾</span> Switch to Farmer App to Add Produce &rarr;
                                    </button>
                                </div>
                            ) : (
                                <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 text-gray-500">
                                    <span className="text-4xl block mb-2">🔍</span>
                                    <p className="font-bold">No items found matching your filters.</p>
                                    <button
                                        onClick={() => {
                                            setActiveChannel('all');
                                            setSelectedCategory('All');
                                            setSearchQuery('');
                                        }}
                                        className="mt-3 text-xs text-emerald-700 font-bold underline"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {listings.map(listing => (
                                    <ProductCard
                                        key={listing.id}
                                        listing={listing}
                                        onSelect={(prod) => setSelectedProduct(prod)}
                                        onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
                                        onRequestQuote={(prod) => setSelectedProductForRfq(prod)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            )}

            {/* MODALS & DRAWERS */}
            {/* Product Detail Modal */}
            <ProductDetailModal
                listing={selectedProduct}
                isOpen={Boolean(selectedProduct)}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={(prod, qty, fulfillment) => handleAddToCart(prod, qty, fulfillment)}
                onRequestQuote={(prod) => setSelectedProductForRfq(prod)}
            />

            {/* Cart Drawer */}
            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cartItems={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateFulfillment={handleUpdateFulfillment}
                onRemoveItem={handleRemoveItem}
                onProceedToCheckout={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                }}
            />

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                cartItems={cart}
                onOrderPlaced={(order) => {
                    setConfirmedOrder(order);
                    setCart([]);
                }}
                onRequireAuth={() => {
                    setAuthDefaultTab(activeMode === 'wholesale' ? 'b2b' : 'retail');
                    setIsAuthOpen(true);
                }}
            />

            {/* Order Success Pass Modal */}
            <OrderSuccessModal
                order={confirmedOrder}
                isOpen={Boolean(confirmedOrder)}
                onClose={() => setConfirmedOrder(null)}
                onViewOrders={() => {
                    setConfirmedOrder(null);
                    setIsOrdersViewOpen(true);
                }}
            />

            {/* Auth Registration Modal */}
            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                defaultTab={authDefaultTab}
            />

            {/* B2B Custom Quote RFQ Modal */}
            <B2BQuoteModal
                listing={selectedProductForRfq}
                isOpen={Boolean(selectedProductForRfq)}
                onClose={() => setSelectedProductForRfq(null)}
                onViewQuotes={() => {
                    setSelectedProductForRfq(null);
                    handleOpenQuotes();
                }}
                onRequireAuth={() => {
                    setAuthDefaultTab('b2b');
                    setIsAuthOpen(true);
                }}
            />
        </div>
    );
}
