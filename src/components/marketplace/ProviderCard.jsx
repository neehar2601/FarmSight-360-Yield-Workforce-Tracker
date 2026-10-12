import React from 'react';
import { formatRate } from '../../utils/pricing';

const ProviderCard = ({ provider, onSelect }) => {
    const {
        id,
        name,
        type,
        location,
        bio,
        isVerified,
        totalWorkers,
        worksAsTeam,
        teamSize,
        services = [],
    } = provider;

    // Cheapest listed rate (units differ, so we show that service's own unit)
    const cheapest = services.reduce((min, s) => {
        if (s.price == null) return min;
        return !min || Number(s.price) < Number(min.price) ? s : min;
    }, null);

    const categories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-800/80 transition-all duration-300 flex flex-col justify-between group">
            <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                            {name ? name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {name}
                                </h3>
                                {isVerified && (
                                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400" title="Verified Provider">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                                    type === 'firm'
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                                        : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400'
                                }`}>
                                    {type === 'firm' ? 'Workforce Firm' : 'Independent Specialist'}
                                </span>
                                {location && (
                                    <span className="flex items-center gap-0.5 truncate">
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600 text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {totalWorkers} {totalWorkers === 1 ? 'Worker' : 'Workers'}
                        </span>
                        {worksAsTeam && teamSize > 1 && (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold text-indigo-700 dark:text-indigo-300" title={`Deployed in teams of ${teamSize}`}>
                                👥 Teams of {teamSize}
                            </span>
                        )}
                    </div>
                </div>

                {/* Bio */}
                {bio && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 leading-relaxed">
                        {bio}
                    </p>
                )}

                {/* Categories */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {categories.length > 0 ? (
                        categories.map(cat => (
                            <span
                                key={cat}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40"
                            >
                                {cat}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">General Farm Services</span>
                    )}
                </div>
            </div>

            {/* Footer with Price and Action */}
            <div className="pt-3 border-t border-gray-100 dark:border-slate-700/80 flex items-center justify-between gap-3">
                <div>
                    <span className="block text-[11px] text-gray-500 dark:text-slate-400 font-medium">Starting from</span>
                    <span className="text-base font-bold text-gray-900 dark:text-white">
                        {cheapest ? formatRate(cheapest) : 'Contact for pricing'}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => onSelect(provider)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                >
                    <span>View & Book</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ProviderCard;
