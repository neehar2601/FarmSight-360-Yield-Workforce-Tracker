import React, { useState } from 'react';
import { mockStore } from '../../mock/mockStore';

export default function CheckoutModal({
    isOpen,
    onClose,
    cartItems,
    onOrderPlaced,
    onRequireAuth,
}) {
    if (!isOpen) return null;

    const user = mockStore.getCurrentUser();
    const isRetail = user?.role === 'customer';
    const isB2B = user?.role === 'b2b_buyer';

    const hasHubItems = cartItems.some(i => i.channel === 'hub_consignment');
    const isB2BOrder = isB2B || cartItems.some(i => i.channel === 'b2b_bulk');

    // Default fulfillment choice based on items
    const [fulfillmentChoice, setFulfillmentChoice] = useState(() => {
        if (isB2BOrder) return 'b2b_freight';
        if (hasHubItems) return 'hub_delivery';
        const itemWithCourier = cartItems.find(i => i.fulfillment_type === 'direct_courier');
        if (itemWithCourier) return 'direct_courier';
        return 'farm_pickup';
    });

    const [pickupSlot, setPickupSlot] = useState('Tomorrow, 10:00 AM – 1:00 PM');
    const [deliveryAddress, setDeliveryAddress] = useState(
        user?.address?.street
            ? `${user.address.street}, ${user.address.city} - ${user.address.pincode}`
            : user?.b2b_profile?.warehouse_address || 'Plot 14, APMC Yard, Yeshwanthpur, Bengaluru 560022'
    );
    const [paymentMethod, setPaymentMethod] = useState(fulfillmentChoice === 'farm_pickup' ? 'pay_at_pickup' : 'online_escrow');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Compute effective fulfillment
    const isPickup = fulfillmentChoice === 'farm_pickup';
    const isCourier = fulfillmentChoice === 'direct_courier' || fulfillmentChoice === 'hub_delivery';

    const subtotal = cartItems.reduce((acc, i) => acc + (i.unit_price * i.quantity), 0);
    const shippingFee = isCourier ? 40 : 0;
    const tax = isB2BOrder ? Math.round(subtotal * 0.05) : 0;
    const total = subtotal + shippingFee + tax;

    const handleConfirmOrder = () => {
        setIsSubmitting(true);
        // Map cart items to the selected fulfillment choice
        const normalizedItems = cartItems.map(item => ({
            ...item,
            fulfillment_type: fulfillmentChoice
        }));

        const res = mockStore.placeOrder({
            items: normalizedItems,
            fulfillment_type: fulfillmentChoice,
            pickup_details: isPickup ? {
                slot: pickupSlot,
                location: cartItems[0]?.pickup_address || 'Gate 2, Deccan Organic Estate, Maddur-Mandya Road, Mandya'
            } : null,
            shipping_address: (isCourier || isB2BOrder) ? {
                street: deliveryAddress,
                city: 'Bengaluru',
                pincode: '560022'
            } : null,
            payment_method: paymentMethod,
        });

        setIsSubmitting(false);
        if (res.data) {
            onOrderPlaced(res.data);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-900">Checkout & Booking</h3>
                        <p className="text-xs text-gray-500">Ordering as <strong>{user.name}</strong> ({isB2B ? 'B2B Wholesale' : 'Retail Consumer'})</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
                        &times;
                    </button>
                </div>

                {/* Items preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-2 text-xs">
                    <span className="font-bold text-gray-700 block">Order Items ({cartItems.length}):</span>
                    {cartItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-gray-800">
                            <span>
                                {item.title} &times; <strong>{item.quantity} {item.unit}</strong>
                            </span>
                            <span className="font-bold">₹{(item.unit_price * item.quantity).toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                {/* FULFILLMENT METHOD SELECTOR */}
                {!isB2BOrder && !hasHubItems && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-800 block">
                            Choose Fulfillment Option:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setFulfillmentChoice('farm_pickup');
                                    setPaymentMethod('pay_at_pickup');
                                }}
                                className={`p-3 rounded-2xl border text-left transition-all ${
                                    isPickup
                                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-extrabold text-xs">🚜 Farm Pickup</span>
                                    <span className="text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">FREE</span>
                                </div>
                                <p className="text-[11px] text-gray-600">Collect at farm gate with 6-digit pickup PIN.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setFulfillmentChoice('direct_courier');
                                    setPaymentMethod('online_escrow');
                                }}
                                className={`p-3 rounded-2xl border text-left transition-all ${
                                    fulfillmentChoice === 'direct_courier'
                                        ? 'border-purple-500 bg-purple-50/70 text-purple-950 shadow-sm ring-2 ring-purple-500/20'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-extrabold text-xs">🚚 Direct Courier</span>
                                    <span className="text-[10px] font-black uppercase bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded">+₹40</span>
                                </div>
                                <p className="text-[11px] text-gray-600">Doorstep delivery with receipt confirmation code.</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Pickup details if Farm Pickup */}
                {isPickup && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                            <span>🚜</span> Farm Gate Pickup Booking
                        </div>
                        <p className="text-[11px] text-amber-800">
                            Collect directly at farm gate. Zero shipping fee. Freshest harvest guaranteed.
                        </p>
                        <div>
                            <label className="font-bold text-amber-900 block mb-1">Select Pickup Time Slot:</label>
                            <select
                                value={pickupSlot}
                                onChange={(e) => setPickupSlot(e.target.value)}
                                className="w-full p-2 border border-amber-300 rounded-xl bg-white font-medium text-xs"
                            >
                                <option value="Tomorrow, 9:00 AM – 12:00 PM">Tomorrow, 9:00 AM – 12:00 PM</option>
                                <option value="Tomorrow, 1:00 PM – 5:00 PM">Tomorrow, 1:00 PM – 5:00 PM</option>
                                <option value="This Saturday, 10:00 AM – 2:00 PM">This Saturday, 10:00 AM – 2:00 PM</option>
                                <option value="This Sunday, 10:00 AM – 2:00 PM">This Sunday, 10:00 AM – 2:00 PM</option>
                            </select>
                        </div>
                        <div className="text-[10px] text-amber-800 bg-amber-100/70 p-2 rounded-xl border border-amber-300 space-y-0.5">
                            <span className="font-bold block">🔒 Approval Process:</span>
                            <span>When you book, this order is submitted to the farmer for approval. Once accepted, your <strong>6-digit Pickup PIN</strong> will unlock.</span>
                        </div>
                    </div>
                )}

                {/* Delivery Address if Courier or Hub */}
                {isCourier && (
                    <div className="space-y-2 text-xs">
                        <label className="font-bold text-gray-700 block">
                            {fulfillmentChoice === 'hub_delivery' ? 'Central Hub Consignment Delivery Address:' : 'Courier Delivery Address:'}
                        </label>
                        <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Enter delivery address, apartment, locality"
                            className="w-full p-2.5 border border-gray-300 rounded-xl font-medium"
                        />
                        <div className="text-[10px] text-purple-900 bg-purple-50 p-2.5 rounded-xl border border-purple-200 space-y-0.5">
                            <span className="font-bold block">🔒 Approval & Delivery Code:</span>
                            <span>Your courier order goes to the farmer for approval first. Once approved and dispatched, you will receive a <strong>6-digit Delivery Confirmation Code</strong> to verify receipt.</span>
                        </div>
                    </div>
                )}

                {/* Payment Method */}
                <div className="space-y-2 text-xs">
                    <label className="font-bold text-gray-700 block">Select Payment Method:</label>
                    <div className="space-y-2">
                        {isPickup && (
                            <label className="p-3 border border-emerald-200 rounded-xl flex items-center gap-2 cursor-pointer bg-emerald-50/50">
                                <input
                                    type="radio"
                                    name="payment"
                                    checked={paymentMethod === 'pay_at_pickup'}
                                    onChange={() => setPaymentMethod('pay_at_pickup')}
                                />
                                <div>
                                    <span className="font-bold text-gray-800 block">Pay at Farm Gate (Cash / UPI on Collection)</span>
                                    <span className="text-[11px] text-gray-500">Inspect produce firsthand before paying</span>
                                </div>
                            </label>
                        )}

                        <label className="p-3 border border-gray-200 rounded-xl flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="payment"
                                checked={paymentMethod === 'online_escrow'}
                                onChange={() => setPaymentMethod('online_escrow')}
                            />
                            <div>
                                <span className="font-bold text-gray-800 block">Simulated Online Escrow Payment</span>
                                <span className="text-[11px] text-gray-500">Funds are protected safely in escrow and only released to the farmer after pickup or delivery confirmation code verification</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                    </div>
                    {shippingFee > 0 && (
                        <div className="flex justify-between">
                            <span>Courier Shipping:</span>
                            <span className="font-bold">₹{shippingFee}</span>
                        </div>
                    )}
                    {tax > 0 && (
                        <div className="flex justify-between">
                            <span>GST (5% B2B):</span>
                            <span className="font-bold">₹{tax.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-1.5 text-base font-black text-gray-900">
                        <span>Total Payable:</span>
                        <span className="text-emerald-700">₹{total.toLocaleString()}</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                    >
                        Back to Cart
                    </button>
                    <button
                        onClick={handleConfirmOrder}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg transition-all"
                    >
                        {isSubmitting ? 'Placing Order...' : 'Confirm & Place Order →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
