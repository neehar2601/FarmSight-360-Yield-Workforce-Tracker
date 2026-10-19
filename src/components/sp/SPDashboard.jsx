import React, { useState, useEffect } from 'react';
import { useSPAuth } from '../../contexts/SPAuthContext';
import { spProviderApi } from '../../utils/spApi';
import AvailabilityCalendar from '../marketplace/AvailabilityCalendar';
import { formatQuantity } from '../../utils/pricing';
import SPInvoiceModal from './SPInvoiceModal';
import { InvoiceStatusBadge, money } from '../billing/billingUi';

const SPDashboard = ({ onNavigateToProfile }) => {
    const { currentSP } = useSPAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState(null);

    // Decline modal
    const [declineBooking, setDeclineBooking] = useState(null);
    const [declineReason, setDeclineReason] = useState('');

    // Complete-work confirmation
    const [completeBooking, setCompleteBooking] = useState(null);

    // Bill editor
    const [openInvoiceId, setOpenInvoiceId] = useState(null);
    const todayIso = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await spProviderApi.listBookings();
            setBookings(res.bookings || []);
        } catch (err) {
            console.error('Failed to load SP bookings:', err);
            setError(err.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleConfirmBooking = async (bookingId) => {
        setActionLoading(bookingId);
        try {
            await spProviderApi.updateBookingStatus(bookingId, 'confirmed');
            fetchBookings();
        } catch (err) {
            alert(err.message || 'Failed to confirm booking');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeclineBooking = async (e) => {
        e.preventDefault();
        if (!declineBooking) return;
        setActionLoading(declineBooking.id);
        try {
            await spProviderApi.updateBookingStatus(declineBooking.id, 'cancelled', declineReason);
            setDeclineBooking(null);
            setDeclineReason('');
            fetchBookings();
        } catch (err) {
            alert(err.message || 'Failed to decline booking');
        } finally {
            setActionLoading(null);
        }
    };

    /** Finish the job: drafts the bill and opens it so the provider can adjust it before sending. */
    const handleCompleteWork = async (booking) => {
        setCompleteBooking(null);
        setActionLoading(booking.id);
        try {
            const res = await spProviderApi.completeBooking(booking.id);
            await fetchBookings();
            setOpenInvoiceId(res.invoice.id);
        } catch (err) {
            alert(err.message || 'Failed to mark work complete');
        } finally {
            setActionLoading(null);
        }
    };

    // Metrics calculations
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const completedBookings = bookings.filter(b => b.status === 'completed');

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)
        + completedBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

    // Billing metrics (completed jobs only)
    const collected = completedBookings.filter(b => b.invoiceStatus === 'paid').reduce((s, b) => s + Number(b.invoiceTotal || 0), 0);
    const outstanding = completedBookings.filter(b => b.invoiceStatus && b.invoiceStatus !== 'paid').reduce((s, b) => s + Number(b.invoiceTotal || 0), 0);
    const needsBill = completedBookings.filter(b => !b.invoiceStatus || b.invoiceStatus === 'draft' || b.invoiceStatus === 'disputed');

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Provider Welcome */}
            <div className="bg-gradient-to-r from-teal-800 via-emerald-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider">
                            Service Provider Portal
                        </span>
                        <span className="text-xs text-emerald-200">
                            {currentSP?.type === 'firm' ? '🏢 Workforce Agency' : '👤 Independent Specialist'}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Welcome back, {currentSP?.name}!
                    </h1>
                    <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                        Manage your incoming booking requests, worker deployments, and calendar availability.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onNavigateToProfile}
                    className="px-5 py-2.5 rounded-2xl bg-white text-emerald-900 font-bold text-xs shadow-md hover:bg-emerald-50 transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                    <span>Manage Services &amp; Profile</span>
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Pending Requests</span>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                            {pendingBookings.length}
                        </span>
                        <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-lg">
                            ⏳
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Confirmed Jobs</span>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            {confirmedBookings.length}
                        </span>
                        <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-lg">
                            ✅
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Active Capacity</span>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                            {currentSP?.totalWorkers || 1}
                        </span>
                        <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-lg">
                            👥
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Pipeline Volume</span>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                            ₹{totalRevenue.toLocaleString('en-IN')}
                        </span>
                        <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 text-lg">
                            💰
                        </span>
                    </div>
                </div>
            </div>

            {/* Layout: Pending Requests + Calendar Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bookings Stream (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Pending Actions */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span>Action Required: Pending Requests</span>
                                {pendingBookings.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                                        {pendingBookings.length}
                                    </span>
                                )}
                            </h2>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-xs text-gray-500 dark:text-slate-400">Loading requests...</div>
                        ) : pendingBookings.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-600 dark:text-gray-300 italic">
                                No pending requests awaiting confirmation.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingBookings.map((b) => (
                                    <div
                                        key={b.id}
                                        className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {b.farmUserName || 'Farmer Customer'}
                                                </h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                                    {b.serviceName} ({b.serviceCategory})
                                                </p>
                                                {b.farmUserEmail && (
                                                    <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                                                        ✉️ {b.farmUserEmail}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block">
                                                    ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                                    {b.workersNeeded} Worker{b.workersNeeded > 1 ? 's' : ''}
                                                    {formatQuantity(b) ? ` • ${formatQuantity(b)}` : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-xs bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-xl text-gray-700 dark:text-gray-200 flex justify-between items-center">
                                            <span>
                                                📅 Scheduled: <strong>{b.startDate}</strong> → <strong>{b.endDate}</strong>
                                            </span>
                                            {b.notes && (
                                                <span className="truncate max-w-xs text-gray-600 dark:text-gray-300 italic">
                                                    "{b.notes}"
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setDeclineBooking(b)}
                                                disabled={actionLoading === b.id}
                                                className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-xs font-semibold transition-colors"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleConfirmBooking(b.id)}
                                                disabled={actionLoading === b.id}
                                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                                            >
                                                {actionLoading === b.id ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <span>Accept &amp; Confirm</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Confirmed Schedule */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">
                            Confirmed Upcoming Deployments
                        </h2>

                        {confirmedBookings.length === 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic py-6 text-center">
                                No upcoming confirmed deployments yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {confirmedBookings.map((b) => (
                                    <div
                                        key={b.id}
                                        className="p-4 rounded-2xl border border-gray-100 dark:border-slate-700/80 bg-gray-50/60 dark:bg-slate-700/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 dark:text-white text-sm">
                                                    {b.farmUserName || 'Customer'}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                                                    {b.serviceName}
                                                </span>
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                                Dates: <strong>{b.startDate}</strong> to <strong>{b.endDate}</strong> • {b.workersNeeded} Worker(s){formatQuantity(b) ? ` • ${formatQuantity(b)}` : ''}
                                            </p>
                                        </div>

                                        <div className="text-right space-y-1.5">
                                            <span className="font-bold text-gray-900 dark:text-white block">
                                                ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                                            </span>
                                            {b.startDate <= todayIso ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setCompleteBooking(b)}
                                                    disabled={actionLoading === b.id}
                                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-semibold shadow-sm"
                                                >
                                                    {actionLoading === b.id ? 'Working…' : 'Mark complete & bill'}
                                                </button>
                                            ) : (
                                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    Confirmed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Billing & Payments */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span>Billing &amp; Payments</span>
                                {needsBill.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                                        {needsBill.length} need attention
                                    </span>
                                )}
                            </h2>
                            <div className="flex gap-4 text-xs">
                                <span className="text-gray-600 dark:text-gray-300">Collected <strong className="text-emerald-700 dark:text-emerald-400">{money(collected)}</strong></span>
                                <span className="text-gray-600 dark:text-gray-300">Outstanding <strong className="text-amber-700 dark:text-amber-400">{money(outstanding)}</strong></span>
                            </div>
                        </div>

                        {completedBookings.length === 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic py-6 text-center">
                                Finished jobs appear here. Mark a deployment complete to create its bill.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {completedBookings.map((b) => (
                                    <div
                                        key={b.id}
                                        className="p-4 rounded-2xl border border-gray-100 dark:border-slate-700/80 bg-gray-50/60 dark:bg-slate-700/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-gray-900 dark:text-white text-sm">{b.farmUserName || 'Customer'}</span>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">{b.serviceName}</span>
                                                {b.invoiceStatus && <InvoiceStatusBadge status={b.invoiceStatus} viewer="sp" />}
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {b.startDate} → {b.endDate}{b.invoiceNumber ? ` • ${b.invoiceNumber}` : ''}{b.receiptNumber ? ` • ${b.receiptNumber}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 self-start sm:self-auto">
                                            <span className="font-bold text-gray-900 dark:text-white">{money(b.invoiceTotal ?? b.totalAmount)}</span>
                                            {b.invoiceId && (
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenInvoiceId(b.invoiceId)}
                                                    className={`px-3.5 py-1.5 rounded-xl text-[11px] font-semibold shadow-sm ${
                                                        b.invoiceStatus === 'paid'
                                                            ? 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    }`}
                                                >
                                                    {b.invoiceStatus === 'paid' ? 'View receipt'
                                                        : b.invoiceStatus === 'draft' ? 'Edit & send bill'
                                                        : b.invoiceStatus === 'disputed' ? 'Review discrepancy'
                                                        : 'Open bill / collect'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Calendar View (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    {currentSP?.id && (
                        <AvailabilityCalendar
                            spId={currentSP.id}
                            onSelectDate={null}
                        />
                    )}

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                        <h4 className="font-bold text-gray-900 dark:text-white">Need a day off?</h4>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                            Block entire dates in your Profile &amp; Calendar settings to automatically prevent farmer bookings on holidays.
                        </p>
                        <button
                            type="button"
                            onClick={onNavigateToProfile}
                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-block pt-1"
                        >
                            Block Dates →
                        </button>
                    </div>
                </div>
            </div>

            {openInvoiceId && (
                <SPInvoiceModal
                    invoiceId={openInvoiceId}
                    onClose={() => setOpenInvoiceId(null)}
                    onChanged={fetchBookings}
                />
            )}

            {/* Complete & bill confirmation */}
            {completeBooking && (
                <div id="complete-work-dialog" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-700 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mark work as complete?</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            Mark <strong>{completeBooking.serviceName}</strong> for <strong>{completeBooking.farmUserName || 'the customer'}</strong> as complete. A draft bill will be created that you can adjust (trees, hours, extra costs) before sending it to the farmer.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                id="complete-work-cancel"
                                type="button"
                                onClick={() => setCompleteBooking(null)}
                                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                id="complete-work-confirm"
                                type="button"
                                onClick={() => handleCompleteWork(completeBooking)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                            >
                                Complete &amp; create bill
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Decline Modal */}
            {declineBooking && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-700 shadow-2xl space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Decline Booking Request</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            Decline booking from <strong>{declineBooking.farmUserName}</strong> for {declineBooking.startDate}? This will immediately release the workers back to your pool.
                        </p>

                        <form onSubmit={handleDeclineBooking} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Reason for Declining (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    placeholder="e.g. Schedule fully committed, equipment maintenance..."
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeclineBooking(null)}
                                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md"
                                >
                                    Decline Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SPDashboard;
