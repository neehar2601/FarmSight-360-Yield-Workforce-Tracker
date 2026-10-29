import React, { useState, useEffect } from 'react';
import { spFarmerBookingApi } from '../../utils/spApi';
import { formatQuantity } from '../../utils/pricing';
import FarmerInvoiceModal from './FarmerInvoiceModal';
import { InvoiceStatusBadge, money } from '../billing/billingUi';

const MyBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cancel modal state
    const [cancellingBooking, setCancellingBooking] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    // Bill modal
    const [openInvoiceId, setOpenInvoiceId] = useState(null);

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await spFarmerBookingApi.listMyBookings(statusFilter || undefined);
            setBookings(res.bookings || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError(err.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const handleConfirmCancel = async (e) => {
        e.preventDefault();
        if (!cancellingBooking) return;

        setIsCancelling(true);
        try {
            await spFarmerBookingApi.cancelBooking(cancellingBooking.id, cancelReason);
            setCancellingBooking(null);
            setCancelReason('');
            fetchBookings();
        } catch (err) {
            alert(err.message || 'Failed to cancel booking');
        } finally {
            setIsCancelling(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Pending Confirmation
                    </span>
                );
            case 'confirmed':
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Confirmed
                    </span>
                );
            case 'completed':
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        Completed
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                        Cancelled
                    </span>
                );
            case 'held':
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200">
                        In Checkout Hold
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                        My Booked Services
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Track your contract worker bookings, schedules, and provider contact details.
                    </p>
                </div>

                <a
                    href="/services"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Browse &amp; Book More</span>
                </a>
            </div>

            {/* Bills needing the farmer's attention */}
            {(() => {
                const toVerify = bookings.filter(b => b.invoiceStatus === 'issued');
                const toPay = bookings.filter(b => b.invoiceStatus === 'approved');
                if (toVerify.length + toPay.length === 0) return null;
                return (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-base">🧾</span>
                        <span className="font-bold">
                            {toVerify.length > 0 && `${toVerify.length} bill${toVerify.length > 1 ? 's' : ''} to verify`}
                            {toVerify.length > 0 && toPay.length > 0 && ' · '}
                            {toPay.length > 0 && `${toPay.length} bill${toPay.length > 1 ? 's' : ''} awaiting payment`}
                        </span>
                        <span className="opacity-80">Open the booking below to review the amounts, report any discrepancy, and pay.</span>
                    </div>
                );
            })()}

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100 dark:border-slate-800">
                {[
                    { label: 'All Bookings', value: '' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Confirmed', value: 'confirmed' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Cancelled', value: 'cancelled' },
                ].map(tab => (
                    <button
                        key={tab.value}
                        type="button"
                        onClick={() => setStatusFilter(tab.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            statusFilter === tab.value
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Bookings List */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Loading your service requests...</p>
                </div>
            ) : error ? (
                <div className="p-8 bg-rose-50 dark:bg-rose-950/40 rounded-3xl border border-rose-200 dark:border-rose-900 text-center text-sm text-rose-700 dark:text-rose-400">
                    {error}
                </div>
            ) : bookings.length === 0 ? (
                <div className="p-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-3">
                    <div className="text-3xl">📋</div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">No Bookings Found</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        You have no service bookings matching this status. Explore our marketplace to book workforce and specialized equipment operators.
                    </p>
                    <a
                        href="/services"
                        className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                    >
                        Browse Services
                    </a>
                </div>
            ) : (
                <div id="demo-bookings-list" className="space-y-4">
                    {bookings.map((b) => (
                        <div
                            key={b.id}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-700/80">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                            {b.spName}
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                            {b.serviceCategory}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
                                        {b.serviceName}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                    {getStatusBadge(b.status)}
                                </div>
                            </div>

                            {/* Details Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs">
                                <div>
                                    <span className="text-gray-500 dark:text-slate-400 block font-medium">Dates</span>
                                    <span className="font-semibold text-gray-900 dark:text-white mt-0.5 block">
                                        {b.startDate} → {b.endDate}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-slate-400 block font-medium">Workers</span>
                                    <span className="font-semibold text-gray-900 dark:text-white mt-0.5 block">
                                        {b.workersNeeded} Worker{b.workersNeeded > 1 ? 's' : ''}
                                        {formatQuantity(b) ? ` • ${formatQuantity(b)}` : ''}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-slate-400 block font-medium">{b.invoiceStatus ? 'Bill Total' : 'Estimated Total'}</span>
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block text-sm">
                                        ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-slate-400 block font-medium">Provider Contact</span>
                                    {b.spPhone ? (
                                        <a
                                            href={`tel:${b.spPhone}`}
                                            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5 block"
                                        >
                                            📞 {b.spPhone}
                                        </a>
                                    ) : (
                                        <span className="text-gray-500 dark:text-slate-400 italic mt-0.5 block">
                                            Visible once confirmed
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Notes or cancellation reason */}
                            {(b.notes || b.cancelReason) && (
                                <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-700/40 rounded-xl text-xs space-y-1">
                                    {b.notes && (
                                        <p className="text-gray-700 dark:text-gray-300">
                                            <strong>Notes:</strong> {b.notes}
                                        </p>
                                    )}
                                    {b.cancelReason && (
                                        <p className="text-rose-600 dark:text-rose-400">
                                            <strong>Cancelled ({b.cancelledBy}):</strong> {b.cancelReason}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Bill (completed jobs) */}
                            {b.status === 'completed' && (
                                <div className="mt-3 p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                    {b.invoiceId ? (
                                        <>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-800 dark:text-gray-100">🧾 {b.invoiceNumber}</span>
                                                <InvoiceStatusBadge status={b.invoiceStatus} viewer="farmer" />
                                                {b.receiptNumber && <span className="text-gray-500 dark:text-gray-400">Receipt {b.receiptNumber}</span>}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenInvoiceId(b.invoiceId)}
                                                className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-sm self-start sm:self-auto ${
                                                    b.invoiceStatus === 'paid'
                                                        ? 'border border-gray-300 dark:border-slate-500 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600'
                                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                }`}
                                            >
                                                {b.invoiceStatus === 'paid' ? 'View receipt'
                                                    : b.invoiceStatus === 'issued' ? `Verify bill (${money(b.invoiceTotal)})`
                                                    : b.invoiceStatus === 'approved' ? `Pay ${money(b.invoiceTotal)}`
                                                    : 'View bill'}
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-gray-600 dark:text-gray-300 italic">
                                            Work completed — the provider is preparing your bill.
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            {['pending', 'confirmed'].includes(b.status) && (
                                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/80 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setCancellingBooking(b)}
                                        className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:underline"
                                    >
                                        Cancel Booking
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {openInvoiceId && (
                <FarmerInvoiceModal
                    invoiceId={openInvoiceId}
                    onClose={() => setOpenInvoiceId(null)}
                    onChanged={fetchBookings}
                />
            )}

            {/* Cancel Modal */}
            {cancellingBooking && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-700 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cancel Service Booking</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            Are you sure you want to cancel the booking with <strong>{cancellingBooking.spName}</strong> for {cancellingBooking.startDate}? This will free up the workers immediately.
                        </p>

                        <form onSubmit={handleConfirmCancel} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Reason for Cancellation (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="e.g. Schedule clash, weather change..."
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCancellingBooking(null)}
                                    disabled={isCancelling}
                                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                                >
                                    Keep Booking
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCancelling}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition-colors"
                                >
                                    {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBookingsPage;
