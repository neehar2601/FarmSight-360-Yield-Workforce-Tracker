import React, { useState, useEffect } from 'react';
import { spPublicApi } from '../../utils/spApi';
import ProviderCard from './ProviderCard';
import ProviderDetailPage from './ProviderDetailPage';

const BrowseServicesPage = ({ selectedProviderId = null }) => {
    const [providers, setProviders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Selected provider for detail view
    const [activeProviderId, setActiveProviderId] = useState(selectedProviderId);

    useEffect(() => {
        setActiveProviderId(selectedProviderId);
    }, [selectedProviderId]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [workersNeeded, setWorkersNeeded] = useState(1);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Load categories once
    useEffect(() => {
        spPublicApi.listCategories()
            .then(res => setCategories(res.categories || []))
            .catch(err => console.warn('Could not load categories:', err));
    }, []);

    // Load providers on filter change
    useEffect(() => {
        let isMounted = true;
        const fetchProviders = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = {
                    q: searchQuery || undefined,
                    category: selectedCategory || undefined,
                    location: locationFilter || undefined,
                    from: fromDate || undefined,
                    to: toDate || undefined,
                    workers: fromDate || toDate ? workersNeeded : undefined,
                    page,
                    limit: 12,
                };
                const res = await spPublicApi.listProviders(params);
                if (isMounted) {
                    setProviders(res.providers || []);
                    setTotal(res.total || 0);
                }
            } catch (err) {
                if (isMounted) setError(err.message || 'Failed to fetch providers');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        const timer = setTimeout(fetchProviders, 250);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [searchQuery, selectedCategory, locationFilter, fromDate, toDate, workersNeeded, page]);

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setLocationFilter('');
        setFromDate('');
        setToDate('');
        setWorkersNeeded(1);
        setPage(1);
    };

    if (activeProviderId) {
        return (
            <ProviderDetailPage
                providerId={activeProviderId}
                onBack={() => {
                    setActiveProviderId(null);
                    window.history.pushState({}, '', '/services');
                }}
            />
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider mb-2">
                        ⭐ Farm360 Service Marketplace
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Find &amp; Book Contract Workforce
                    </h1>
                    <p className="mt-2 text-sm text-emerald-100 leading-relaxed">
                        Hire verified irrigation specialists, electricians, harvest labor firms, and agronomists with guaranteed real-time availability blocking.
                    </p>
                </div>
            </div>

            {/* Filter Bar & Controls */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
                {/* Search & Location row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6 relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search by specialist name, service (e.g. Drip Irrigation)..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/60 text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="sm:col-span-3 relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Location / Region..."
                            value={locationFilter}
                            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/60 text-xs text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="w-full py-2.5 px-3 rounded-xl border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>

                {/* Date and Worker Availability filter row */}
                <div className="pt-2 border-t border-gray-100 dark:border-slate-700 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-semibold text-gray-600 dark:text-gray-300 shrink-0">Filter by Dates:</span>
                    <input
                        type="date"
                        value={fromDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100"
                    />
                    <span className="text-gray-500 dark:text-slate-400 font-medium">to</span>
                    <input
                        type="date"
                        value={toDate}
                        min={fromDate || new Date().toISOString().slice(0, 10)}
                        onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100"
                    />

                    {(fromDate || toDate) && (
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Workers:</span>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={workersNeeded}
                                onChange={(e) => setWorkersNeeded(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-16 px-2 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-center font-bold text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
                    <button
                        type="button"
                        onClick={() => { setSelectedCategory(''); setPage(1); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                            selectedCategory === ''
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                    >
                        All Categories
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => { setSelectedCategory(cat === selectedCategory ? '' : cat); setPage(1); }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                                selectedCategory === cat
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Providers Grid */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-9 w-9 border-3 border-emerald-600 border-t-transparent"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Discovering verified providers...</p>
                </div>
            ) : error ? (
                <div className="p-8 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-3xl text-center">
                    <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">{error}</p>
                    <button
                        onClick={handleResetFilters}
                        className="mt-3 px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold"
                    >
                        Reset Search
                    </button>
                </div>
            ) : providers.length === 0 ? (
                <div className="p-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-3">
                    <div className="text-3xl">🔍</div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">No Service Providers Found</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        No specialists match your current filter parameters or date availability. Try broadening your dates or clearing category filters.
                    </p>
                    <button
                        onClick={handleResetFilters}
                        className="mt-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                        Clear All Filters
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Showing {providers.length} of {total} provider{total !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {providers.map((p) => (
                            <ProviderCard
                                key={p.id}
                                provider={p}
                                onSelect={(prov) => {
                                    setActiveProviderId(prov.id);
                                    window.history.pushState({}, '', `/services/${prov.id}`);
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default BrowseServicesPage;
