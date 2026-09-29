import React, { useState } from 'react';

export default function ProductDetailModal({ listing, isOpen, onClose, onAddToCart, onRequestQuote }) {
    if (!isOpen || !listing) return null;

    const [quantity, setQuantity] = useState(listing.min_order_qty || 1);
    const [selectedFulfillment, setSelectedFulfillment] = useState(
        listing.pickup_available ? 'farm_pickup' : 'direct_courier'
    );

    const isB2B = listing.channel === 'b2b_bulk';
    const isHub = listing.channel === 'hub_consignment';

    // Calculate volume price if tiers exist
    let unitPrice = listing.price_per_unit;
    if (listing.bulk_tiers) {
        const matchingTier = listing.bulk_tiers.find(t => quantity >= t.min_qty && (!t.max_qty || quantity <= t.max_qty));
        if (matchingTier) unitPrice = matchingTier.price_per_unit;
    }
    const totalPrice = unitPrice * quantity;

    const handleAdd = () => {
        onAddToCart(listing, quantity, selectedFulfillment);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full text-white ${
                            isB2B ? 'bg-indigo-600' : isHub ? 'bg-blue-600' : 'bg-emerald-600'
                        }`}>
                            {isB2B ? 'B2B Wholesale' : isHub ? 'farm360 Assured (Hub)' : 'Direct Farm Sale'}
                        </span>
                        {listing.is_certified_organic && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500 text-white rounded-full">
                                🌿 Organic Certified
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
                        &times;
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Image & Farm Story */}
                    <div className="space-y-4">
                        <div className="h-60 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                            <img
                                src={listing.image_url}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Farmer & Origin Box */}
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
                            <div className="flex items-center gap-3">
                                <img
                                    src={listing.farmer_avatar}
                                    alt={listing.farmer_name}
                                    className="w-10 h-10 rounded-full object-cover border border-emerald-300"
                                />
                                <div>
                                    <span className="font-extrabold text-emerald-950 block">{listing.farmer_name}</span>
                                    <span className="text-[11px] text-emerald-700 font-medium">{listing.farm_name}</span>
                                </div>
                            </div>
                            <p className="text-emerald-900 text-[11px] leading-relaxed pt-1">
                                Grown with natural practices. Harvested on <strong>{listing.harvest_date}</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Right: Details, Fulfillment choice & Pricing */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">{listing.title}</h2>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <span>Variety: <strong>{listing.variety || 'Heirloom'}</strong></span>
                                <span>&bull;</span>
                                <span>Grade: <strong className="text-emerald-800">{listing.grade}</strong></span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                            {listing.description}
                        </p>

                        {/* FULFILLMENT SELECTOR FOR D2C */}
                        {listing.channel === 'direct' && (
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <label className="text-xs font-bold text-gray-800 block">
                                    Choose Delivery or Farm Pickup:
                                </label>
                                <div className="space-y-2 text-xs">
                                    {listing.pickup_available && (
                                        <label
                                            onClick={() => setSelectedFulfillment('farm_pickup')}
                                            className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                                                selectedFulfillment === 'farm_pickup'
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium shadow-sm'
                                                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="fulfillment"
                                                checked={selectedFulfillment === 'farm_pickup'}
                                                onChange={() => setSelectedFulfillment('farm_pickup')}
                                                className="mt-1 text-emerald-600"
                                            />
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-xs">🚜 Direct Farm Gate Pickup</span>
                                                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">FREE</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500">Collect at: {listing.pickup_address}</p>
                                                <p className="text-[10px] text-emerald-700 font-semibold">★ You will get a 6-Digit PIN to verify upon pickup.</p>
                                            </div>
                                        </label>
                                    )}

                                    {listing.courier_available && (
                                        <label
                                            onClick={() => setSelectedFulfillment('direct_courier')}
                                            className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                                                selectedFulfillment === 'direct_courier'
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium shadow-sm'
                                                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="fulfillment"
                                                checked={selectedFulfillment === 'direct_courier'}
                                                onChange={() => setSelectedFulfillment('direct_courier')}
                                                className="mt-1 text-emerald-600"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-xs">🚚 Direct Courier Delivery</span>
                                                    <span className="text-[10px] text-gray-500 font-bold">+₹{listing.courier_fee_per_order}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500">Packed in ventilated crates and delivered to your address</p>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* HUB CONSIGNMENT BADGE */}
                        {isHub && (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs space-y-1 text-blue-900">
                                <div className="flex items-center gap-1.5 font-extrabold">
                                    <span>🛡️</span> farm360 Assured Hub Delivery
                                </div>
                                <p className="text-[11px] text-blue-800">
                                    Stored at <strong>{listing.hub_name}</strong>. Can be combined with produce from other partner farms into a single shipment!
                                </p>
                            </div>
                        )}

                        {/* WHOLESALE TIERS FOR B2B */}
                        {isB2B && listing.bulk_tiers && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-xs space-y-2 text-indigo-950">
                                <span className="font-bold text-xs block">Volume Tier Pricing:</span>
                                <div className="space-y-1 text-[11px]">
                                    {listing.bulk_tiers.map((t, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span>{t.label}:</span>
                                            <span className="font-extrabold">₹{t.price_per_unit}/{listing.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity Selector & Price Summary */}
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700">Quantity ({listing.unit}):</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setQuantity(Math.max(listing.min_order_qty || 1, quantity - 1))}
                                        className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-bold hover:bg-gray-100 flex items-center justify-center text-sm"
                                    >
                                        -
                                    </button>
                                    <span className="font-black text-base w-12 text-center">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(listing.available_qty, quantity + 1))}
                                        className="w-8 h-8 rounded-lg bg-white border border-gray-300 font-bold hover:bg-gray-100 flex items-center justify-center text-sm"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Amount</span>
                                    <span className="text-2xl font-black text-gray-900">₹{totalPrice.toLocaleString()}</span>
                                </div>

                                <div className="flex gap-2">
                                    {isB2B ? (
                                        <button
                                            onClick={() => {
                                                onClose();
                                                onRequestQuote(listing);
                                            }}
                                            className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-all"
                                        >
                                            Custom RFQ
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                onRequestQuote(listing);
                                            }}
                                            className="px-3.5 py-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl hover:bg-amber-100 transition-all flex items-center gap-1 shadow-sm"
                                            title="Request bulk volume discount directly from farmer"
                                        >
                                            <span>📦</span> Buy in Bulk
                                        </button>
                                    )}
                                    <button
                                        onClick={handleAdd}
                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all hover:scale-105"
                                    >
                                        Add to Cart &rarr;
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
