import React from 'react';

export default function ProductCard({ listing, onSelect, onAddToCart, onRequestQuote }) {
    const isB2B = listing.channel === 'b2b_bulk';
    const isHub = listing.channel === 'hub_consignment';

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between group">
            <div>
                {/* Image & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100 cursor-pointer" onClick={() => onSelect(listing)}>
                    <img
                        src={listing.image_url}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top Channel Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm text-white ${
                            isB2B ? 'bg-indigo-600' :
                            isHub ? 'bg-blue-600' : 'bg-emerald-600'
                        }`}>
                            {isB2B ? '📦 B2B Wholesale' : isHub ? '🛡️ farm360 Assured' : '🌿 Farm Direct'}
                        </span>
                        {listing.is_certified_organic && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500 text-white rounded-full shadow-sm w-fit">
                                Certified Organic
                            </span>
                        )}
                    </div>

                    {/* Stock status badge */}
                    <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur text-white text-[11px] px-2.5 py-1 rounded-lg font-bold">
                        {listing.available_qty} {listing.unit} in stock
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <span>🚜 {listing.farm_name}</span>
                        <span>&bull;</span>
                        <span className="font-semibold text-emerald-800">{listing.grade}</span>
                    </div>

                    <h3
                        onClick={() => onSelect(listing)}
                        className="font-extrabold text-gray-900 text-base leading-snug cursor-pointer hover:text-emerald-700 transition-colors line-clamp-1"
                    >
                        {listing.title}
                    </h3>

                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {listing.description}
                    </p>

                    {/* Fulfillment Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                        {listing.pickup_available && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                                🚜 Farm Pickup
                            </span>
                        )}
                        {listing.courier_available && (
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-bold">
                                🚚 {isHub ? 'Hub Next-Day' : 'Courier Available'}
                            </span>
                        )}
                        {isB2B && (
                            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md font-black">
                                MOQ: {listing.min_order_qty} {listing.unit}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Price & Action */}
            <div className="p-4 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Price per {listing.unit}</span>
                    <span className="text-xl font-black text-gray-900">
                        ₹{listing.price_per_unit.toLocaleString()}
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    {isB2B ? (
                        <>
                            <button
                                onClick={() => onRequestQuote(listing)}
                                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all"
                            >
                                Request RFQ
                            </button>
                            <button
                                onClick={() => onAddToCart(listing, listing.min_order_qty)}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                            >
                                Buy Bulk
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-end gap-1.5">
                            <button
                                onClick={() => onAddToCart(listing, 1)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
                            >
                                <span>+</span> Add to Cart
                            </button>
                            <button
                                onClick={() => onRequestQuote(listing)}
                                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-0.5"
                                title="Request bulk costing directly from farmer"
                            >
                                <span>📦</span> Buy in bulk? Request price
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
