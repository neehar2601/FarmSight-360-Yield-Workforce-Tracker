import React from 'react';

export default function CartDrawer({
    isOpen,
    onClose,
    cartItems,
    onUpdateQuantity,
    onUpdateFulfillment,
    onRemoveItem,
    onProceedToCheckout
}) {
    if (!isOpen) return null;

    const subtotal = cartItems.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    const hasCourier = cartItems.some(i => i.fulfillment_type === 'direct_courier' || i.fulfillment_type === 'hub_delivery');
    const shippingFee = hasCourier ? 40 : 0;
    const total = subtotal + shippingFee;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
                {/* Drawer Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🛍️</span>
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-lg">Your Cart</h3>
                            <span className="text-xs text-gray-500">{cartItems.length} items</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
                        &times;
                    </button>
                </div>

                {/* Items List */}
                <div className="p-5 flex-1 overflow-y-auto space-y-3">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                            <span className="text-5xl">🛒</span>
                            <p className="font-bold text-gray-700">Your cart is empty</p>
                            <p className="text-xs">Browse fresh farm produce or wholesale lots to add items.</p>
                        </div>
                    ) : (
                        cartItems.map((item, idx) => (
                            <div key={idx} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="font-extrabold text-gray-900 text-sm">{item.title}</h4>
                                        <span className="text-[11px] text-gray-500 block">
                                            {item.farm_name} &bull; {item.grade}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onRemoveItem(item.listing_id)}
                                        className="text-gray-400 hover:text-red-600 text-sm font-bold"
                                    >
                                        &times;
                                    </button>
                                </div>

                                {/* Interactive Fulfillment Choice */}
                                {item.channel === 'direct' ? (
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-gray-500 font-semibold block">Fulfillment Method:</span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onUpdateFulfillment && onUpdateFulfillment(item.listing_id, 'farm_pickup')}
                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                                    item.fulfillment_type === 'farm_pickup'
                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                🚜 Farm Pickup (Free)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onUpdateFulfillment && onUpdateFulfillment(item.listing_id, 'direct_courier')}
                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                                    item.fulfillment_type === 'direct_courier'
                                                        ? 'bg-purple-600 text-white shadow-sm'
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                🚚 Courier (+₹40)
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-[10px]">
                                        {item.channel === 'hub_consignment' ? (
                                            <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                                                🛡️ Central Hub Consolidated Delivery
                                            </span>
                                        ) : (
                                            <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">
                                                🚚 Direct Courier Delivery
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onUpdateQuantity(item.listing_id, Math.max(1, item.quantity - 1))}
                                            className="w-6 h-6 rounded-md bg-white border border-gray-300 font-bold hover:bg-gray-100 flex items-center justify-center"
                                        >
                                            -
                                        </button>
                                        <span className="font-bold text-xs">{item.quantity} {item.unit}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.listing_id, item.quantity + 1)}
                                            className="w-6 h-6 rounded-md bg-white border border-gray-300 font-bold hover:bg-gray-100 flex items-center justify-center"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <span className="font-extrabold text-gray-900 text-sm">
                                        ₹{(item.unit_price * item.quantity).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Summary */}
                {cartItems.length > 0 && (
                    <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-3">
                        <div className="space-y-1.5 text-xs text-gray-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-bold text-gray-800">₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery / Shipping</span>
                                <span className="font-bold text-gray-800">
                                    {shippingFee === 0 ? 'FREE (Pickup)' : `₹${shippingFee}`}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black text-gray-900">
                                <span>Total Payable</span>
                                <span className="text-emerald-700">₹{total.toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={onProceedToCheckout}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                        >
                            <span>Proceed to Checkout</span>
                            <span>&rarr;</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
