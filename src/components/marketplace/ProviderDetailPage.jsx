import React, { useState, useEffect } from 'react';
import { spPublicApi } from '../../utils/spApi';
import AvailabilityCalendar from './AvailabilityCalendar';
import BookingModal from './BookingModal';
import { formatRate, describeBilling } from '../../utils/pricing';

const ProviderDetailPage = ({ providerId, onBack }) => {
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchProvider = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await spPublicApi.getProvider(providerId);
                if (isMounted) {
                    setProvider(res.provider);
                    if (res.provider?.services?.length > 0) {
                        setSelectedServiceId(res.provider.services[0].id);
                    }
                }
            } catch (err) {
                if (isMounted) setError(err.message || 'Failed to load provider profile');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (providerId) fetchProvider();
        return () => { isMounted = false; };
    }, [providerId]);

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-600 border-t-transparent"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Loading service provider details...</p>
            </div>
        );
    }

    if (error || !provider) {
        return (
            <div className="max-w-xl mx-auto py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-2xl">
                    ⚠️
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Provider Not Found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{error || 'Could not locate this provider.'}</p>
                <button
                    type="button"
                    onClick={onBack}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                >
                    Back to Marketplace
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Marketplace</span>
                </button>
            </div>

            {/* Provider Header Banner */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-emerald-600/20 shrink-0">
                            {provider.name ? provider.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                    {provider.name}
                                </h1>
                                {provider.isVerified && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Verified
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
                                <span className={`px-2.5 py-0.5 rounded-md font-semibold ${
                                    provider.type === 'firm'
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                        : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                }`}>
                                    {provider.type === 'firm' ? 'Workforce Firm' : 'Independent Specialist'}
                                </span>
                                {provider.location && (
                                    <span className="flex items-center gap-1 font-medium">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {provider.location}
                                    </span>
                                )}
                                <span className="flex items-center gap-1 font-medium">
                                    <span>👥 Capacity:</span>
                                    <strong className="text-gray-900 dark:text-white">{provider.totalWorkers} Workers</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsBookingModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Book Service Now</span>
                    </button>
                </div>

                {provider.bio && (
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">About the Provider</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
                            {provider.bio}
                        </p>
                    </div>
                )}
            </div>

            {/* Grid: Services Offered & Availability Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Services List (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>Services &amp; Pricing</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold">
                                {provider.services?.length || 0}
                            </span>
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {provider.services?.length > 0 ? (
                            provider.services.map((s) => (
                                <div
                                    key={s.id}
                                    className={`p-5 rounded-2xl border transition-all ${
                                        selectedServiceId === s.id
                                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-700 shadow-md ring-1 ring-emerald-500'
                                            : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-base">
                                                    {s.name}
                                                </h4>
                                                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-100/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                                    {s.category}
                                                </span>
                                            </div>
                                            {s.description && (
                                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                                    {s.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="text-base font-extrabold text-gray-900 dark:text-white">
                                                {formatRate(s)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {describeBilling(s)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedServiceId(s.id);
                                                setIsBookingModalOpen(true);
                                            }}
                                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                                        >
                                            Select &amp; Book
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 text-sm">
                                No active services listed yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Availability Calendar (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                    <AvailabilityCalendar
                        spId={provider.id}
                        selectedStartDate={selectedCalendarDate}
                        onSelectDate={(date) => {
                            setSelectedCalendarDate(date);
                            setIsBookingModalOpen(true);
                        }}
                    />

                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                        <strong className="block mb-0.5">ℹ️ Instant Worker Hold Guarantee</strong>
                        Clicking a date or booking will reserve those workers for 10 minutes so no other farm can take them while you finalize.
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {isBookingModalOpen && (
                <BookingModal
                    provider={provider}
                    selectedServiceId={selectedServiceId}
                    initialDate={selectedCalendarDate}
                    onClose={() => setIsBookingModalOpen(false)}
                    onSuccess={() => {
                        setIsBookingModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default ProviderDetailPage;
