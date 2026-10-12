import React, { useState, useEffect, useRef } from 'react';
import { spFarmerBookingApi } from '../../utils/spApi';
import { useAuth } from '../../contexts/AuthContext';
import { billingMode, estimateAmount, formatRate, formatQuantity } from '../../utils/pricing';

const BookingModal = ({ provider, selectedServiceId, initialDate, onClose, onSuccess }) => {
    const { currentFarm } = useAuth();
    const services = provider.services || [];

    const [selectedService, setSelectedService] = useState(() => {
        if (selectedServiceId) {
            return services.find(s => s.id === selectedServiceId) || services[0];
        }
        return services[0] || null;
    });

    const [startDate, setStartDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
    const [workersNeeded, setWorkersNeeded] = useState(1);
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

    // State machine: 'config' | 'held' | 'success' | 'expired'
    const [stage, setStage] = useState('config');
    const [heldBooking, setHeldBooking] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null); // in seconds
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const timerRef = useRef(null);
    const heldBookingIdRef = useRef(null);

    useEffect(() => {
        heldBookingIdRef.current = heldBooking?.id;
    }, [heldBooking]);

    // Cleanup on unmount if held and not yet confirmed
    useEffect(() => {
        return () => {
            if (heldBookingIdRef.current) {
                // Release workers if user abruptly closes modal during hold
                spFarmerBookingApi.releaseHold(heldBookingIdRef.current).catch(() => {});
            }
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Countdown logic
    useEffect(() => {
        if (stage !== 'held' || !heldBooking?.holdExpiresAt) return;

        const updateTimer = () => {
            const expiry = new Date(heldBooking.holdExpiresAt).getTime();
            const now = Date.now();
            const diff = Math.max(0, Math.floor((expiry - now) / 1000));
            setTimeRemaining(diff);

            if (diff <= 0) {
                clearInterval(timerRef.current);
                setStage('expired');
                heldBookingIdRef.current = null;
            }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [stage, heldBooking]);

    // Calculation helper
    const isPerUnit = billingMode(selectedService?.unit) === 'per_unit';
    const calculateEstimate = () =>
        estimateAmount(selectedService, { startDate, endDate, workers: workersNeeded, quantity });

    // 1. Submit Hold
    const handleStartHold = async (e) => {
        e.preventDefault();
        if (!selectedService) {
            setError('Please select a service');
            return;
        }
        if (endDate < startDate) {
            setError('End date cannot be earlier than start date');
            return;
        }
        if (isPerUnit && !(Number(quantity) > 0)) {
            setError(`Enter how many ${selectedService.unit} you need`);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await spFarmerBookingApi.createHold({
                serviceId: selectedService.id,
                startDate,
                endDate,
                workersNeeded,
                quantity: isPerUnit ? Number(quantity) : undefined,
                farmId: currentFarm?.id || null,
                notes,
            });

            setHeldBooking(res.booking);
            setStage('held');
        } catch (err) {
            console.error('Hold error:', err);
            setError(err.message || 'Failed to hold worker capacity. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 2. Confirm Booking
    const handleConfirmBooking = async () => {
        if (!heldBooking) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await spFarmerBookingApi.confirmHold(heldBooking.id, {
                notes,
                farmId: currentFarm?.id || null,
            });
            heldBookingIdRef.current = null; // Do not release on close now
            setHeldBooking(res.booking);
            setStage('success');
            if (onSuccess) onSuccess(res.booking);
        } catch (err) {
            console.error('Confirm error:', err);
            if (err.code === 'HOLD_EXPIRED' || err.status === 410) {
                setStage('expired');
                heldBookingIdRef.current = null;
            } else {
                setError(err.message || 'Failed to confirm booking.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // 3. Release Hold
    const handleReleaseHold = async () => {
        if (heldBooking?.id) {
            setIsSubmitting(true);
            try {
                await spFarmerBookingApi.releaseHold(heldBooking.id);
            } catch (err) {
                console.warn('Release error:', err);
            } finally {
                heldBookingIdRef.current = null;
                setIsSubmitting(false);
                setHeldBooking(null);
                setStage('config');
            }
        } else {
            setStage('config');
        }
    };

    const formatTimer = (secs) => {
        if (secs == null) return '--:--';
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full border border-gray-100 dark:border-slate-700 shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Book Service</span>
                        <h3 className="text-lg font-bold leading-tight">{provider.name}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content based on stage */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2">
                            <span className="text-base leading-none">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* STAGE 1: Config & Reservation request */}
                    {stage === 'config' && (
                        <form onSubmit={handleStartHold} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Select Service
                                </label>
                                <select
                                    value={selectedService?.id || ''}
                                    onChange={(e) => {
                                        const svc = services.find(s => s.id === e.target.value);
                                        setSelectedService(svc);
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                >
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.category}) — {formatRate(s)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().slice(0, 10)}
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        min={startDate}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {isPerUnit && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                        How many {selectedService.unit}? *
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            required
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="e.g. 200"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            × {formatRate(selectedService)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                        Workers Needed
                                    </label>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Max provider capacity: {provider.totalWorkers}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={1}
                                        max={provider.totalWorkers || 1}
                                        value={workersNeeded}
                                        onChange={(e) => setWorkersNeeded(Number(e.target.value))}
                                        className="w-full accent-emerald-600"
                                    />
                                    <span className="w-12 text-center py-1 px-2 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                        {workersNeeded}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Notes or Specific Requirements (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. Irrigation filter setup, gate access instructions..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                                />
                            </div>

                            {/* Cost summary card */}
                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">Estimated Cost</span>
                                    <span className="text-xl font-bold text-emerald-950 dark:text-emerald-100">
                                        ₹{calculateEstimate().toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="text-right text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                                    <span>Real-time DB reservation lock</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Securing Worker Hold...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        <span>Hold Workers & Proceed to Review</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* STAGE 2: LIVE HOLD RESERVATION (Ticket Booking Style) */}
                    {stage === 'held' && (
                        <div className="space-y-4">
                            {/* Live Timer Banner */}
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                                            Workers Blocked For You
                                        </span>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-mono font-bold text-sm">
                                        ⏱️ {formatTimer(timeRemaining)}
                                    </div>
                                </div>
                                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                    <strong>{heldBooking?.workersNeeded} worker(s)</strong> are currently blocked on {provider.name}'s calendar. No other user can book these workers while your reservation is active.
                                </p>
                            </div>

                            {/* Booking Details Card */}
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                                <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-slate-600">
                                    <span className="text-gray-600 dark:text-gray-300 font-medium">Service</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{heldBooking?.serviceName}</span>
                                </div>
                                <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-slate-600">
                                    <span className="text-gray-600 dark:text-gray-300 font-medium">Date Range</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {heldBooking?.startDate} → {heldBooking?.endDate}
                                    </span>
                                </div>
                                {formatQuantity(heldBooking) && (
                                    <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-slate-600">
                                        <span className="text-gray-600 dark:text-gray-300 font-medium">Quantity</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{formatQuantity(heldBooking)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-slate-600">
                                    <span className="text-gray-600 dark:text-gray-300 font-medium">Workers Reserved</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{heldBooking?.workersNeeded} Worker(s)</span>
                                </div>
                                <div className="flex justify-between pt-1 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                    <span>Total Estimate</span>
                                    <span>₹{Number(heldBooking?.totalAmount || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            {/* Confirmation Actions */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleReleaseHold}
                                    disabled={isSubmitting}
                                    className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold text-xs transition-colors"
                                >
                                    Cancel & Release
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmBooking}
                                    disabled={isSubmitting}
                                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Confirm Booking</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STAGE 3: SUCCESS */}
                    {stage === 'success' && (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl animate-bounce">
                                ✓
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">Booking Placed Successfully!</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-sm mx-auto">
                                    Your request has been submitted to <strong>{provider.name}</strong>. The provider will accept or reach out before the start date.
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl text-xs text-gray-700 dark:text-gray-200">
                                <span>Booking Reference: </span>
                                <code className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{heldBooking?.id?.slice(0, 8)}...</code>
                            </div>
                            <div className="flex justify-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        window.location.href = '/bookings';
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all"
                                >
                                    View in My Bookings
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STAGE 4: EXPIRED */}
                    {stage === 'expired' && (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl">
                                ⌛
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-gray-900 dark:text-white">Reservation Expired</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-sm mx-auto">
                                    The 10-minute hold window timed out. The reserved workers have been released back to the marketplace.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStage('config')}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
