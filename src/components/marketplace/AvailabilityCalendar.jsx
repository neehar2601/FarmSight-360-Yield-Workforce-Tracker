import React, { useState, useEffect } from 'react';
import { spPublicApi } from '../../utils/spApi';

const AvailabilityCalendar = ({ spId, onSelectDate, selectedStartDate, selectedEndDate }) => {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [daysData, setDaysData] = useState([]);
    const [totalWorkers, setTotalWorkers] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!spId) return;
        let isMounted = true;
        const fetchMonth = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await spPublicApi.getMonthCalendar(spId, currentMonth);
                if (isMounted) {
                    setDaysData(res.days || []);
                    setTotalWorkers(res.totalWorkers || 1);
                }
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchMonth();
        return () => { isMounted = false; };
    }, [spId, currentMonth]);

    const handlePrevMonth = () => {
        const [y, m] = currentMonth.split('-').map(Number);
        const prev = new Date(Date.UTC(y, m - 2, 1));
        setCurrentMonth(`${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`);
    };

    const handleNextMonth = () => {
        const [y, m] = currentMonth.split('-').map(Number);
        const next = new Date(Date.UTC(y, m, 1));
        setCurrentMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
    };

    const monthLabel = () => {
        const [y, m] = currentMonth.split('-').map(Number);
        const date = new Date(Date.UTC(y, m - 1, 1));
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    };

    // Calculate leading blanks in grid
    const getLeadingBlanks = () => {
        const [y, m] = currentMonth.split('-').map(Number);
        const firstDayOfWeek = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0 is Sunday
        return firstDayOfWeek;
    };

    const isSelected = (dateStr) => {
        if (selectedStartDate && selectedEndDate) {
            return dateStr >= selectedStartDate && dateStr <= selectedEndDate;
        }
        if (selectedStartDate) return dateStr === selectedStartDate;
        return false;
    };

    const isPast = (dateStr) => {
        const today = new Date().toISOString().slice(0, 10);
        return dateStr < today;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>Availability Calendar</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-medium">
                            {totalWorkers} {totalWorkers === 1 ? 'Worker' : 'Workers'} Capacity
                        </span>
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Live booking slots & reserved dates</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                        title="Previous Month"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-32 text-center">
                        {monthLabel()}
                    </span>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                        title="Next Month"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3 pt-1 pb-2 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                    <span>Limited</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                    <span>Full / Blocked</span>
                </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-1">{d}</div>
                ))}
            </div>

            {/* Days grid */}
            {loading ? (
                <div className="h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-emerald-600 border-t-transparent"></div>
                </div>
            ) : error ? (
                <div className="p-4 text-center text-rose-600 text-xs">{error}</div>
            ) : (
                <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: getLeadingBlanks() }).map((_, i) => (
                        <div key={`blank-${i}`} className="h-11 rounded-lg"></div>
                    ))}
                    {daysData.map((d) => {
                        const dayNum = parseInt(d.date.split('-')[2], 10);
                        const past = isPast(d.date);
                        const selected = isSelected(d.date);

                        let badgeBg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
                        if (d.status === 'full' || d.blocked) {
                            badgeBg = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60';
                        } else if (d.status === 'limited') {
                            badgeBg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
                        }

                        if (past) {
                            badgeBg = 'bg-gray-50 dark:bg-slate-900/40 text-gray-400 dark:text-gray-600 border-transparent opacity-60';
                        }

                        const isSelectable = !past && d.status !== 'full' && !d.blocked && onSelectDate;

                        return (
                            <button
                                key={d.date}
                                type="button"
                                disabled={!isSelectable}
                                onClick={() => onSelectDate && onSelectDate(d.date)}
                                className={`h-11 rounded-xl p-1 text-center border flex flex-col items-center justify-center transition-all ${badgeBg} ${
                                    selected
                                        ? 'ring-2 ring-emerald-500 font-bold scale-[1.03] shadow-sm z-10'
                                        : ''
                                } ${isSelectable ? 'cursor-pointer hover:shadow-md hover:scale-[1.04]' : 'cursor-default'}`}
                                title={`${d.date}: ${d.blocked ? 'Provider Day Off' : `${d.available}/${d.total} workers available`}`}
                            >
                                <span className="text-xs leading-none font-semibold">{dayNum}</span>
                                <span className="text-[10px] leading-tight font-medium mt-0.5">
                                    {d.blocked ? 'Off' : `${d.available} left`}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AvailabilityCalendar;
