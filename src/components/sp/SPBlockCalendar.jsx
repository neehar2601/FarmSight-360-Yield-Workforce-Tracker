import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { spProviderApi } from '../../utils/spApi';

// ── Date helpers (UTC-based so a date string never shifts with the timezone) ──
const ymd = (d) => d.toISOString().slice(0, 10);
const todayStr = () => new Date().toISOString().slice(0, 10); // same "today" the API uses
const monthKey = (date) => date.slice(0, 7);
const shiftMonth = (key, delta) => {
    const [y, m] = key.split('-').map(Number);
    return ymd(new Date(Date.UTC(y, m - 1 + delta, 1))).slice(0, 7);
};
const enumerate = (from, to) => {
    const out = [];
    for (let t = Date.parse(from); t <= Date.parse(to); t += 86400000) out.push(ymd(new Date(t)));
    return out;
};
const prettyDate = (s) =>
    new Date(`${s}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Calendar for providers to take days off. Click a start day, then an end day
 * (or block the single day). Click blocked days to select and unblock them.
 * Days that already carry bookings cannot be blocked — the server enforces it
 * under the provider lock and this UI just makes it visible up front.
 */
const SPBlockCalendar = () => {
    const [month, setMonth] = useState(() => todayStr().slice(0, 7));
    const [days, setDays] = useState({});          // date → { total, booked, available, blocked }
    const [blocked, setBlocked] = useState({});    // date → { id, reason }
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);

    const [rangeStart, setRangeStart] = useState(null);
    const [rangeEnd, setRangeEnd] = useState(null);
    const [hoverDate, setHoverDate] = useState(null);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

    const today = todayStr();

    const loadMonth = useCallback(async (key, { reset = false } = {}) => {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await spProviderApi.getMyCalendar(key);
            const nextDays = {};
            (res.days || []).forEach((d) => { nextDays[d.date] = d; });
            const nextBlocked = {};
            (res.blockedDates || []).forEach((b) => {
                nextBlocked[String(b.date).slice(0, 10)] = { id: b.id, reason: b.reason };
            });
            setDays((prev) => (reset ? nextDays : { ...prev, ...nextDays }));
            setBlocked((prev) => (reset ? nextBlocked : { ...prev, ...nextBlocked }));
            setBookings(res.bookings || []);
        } catch (err) {
            setLoadError(err.message || 'Failed to load calendar');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadMonth(month); }, [month, loadMonth]);

    // ── Selection ────────────────────────────────────────────────────────────
    const selFrom = rangeStart;
    const selTo = rangeEnd || rangeStart;
    const previewTo = !rangeEnd && rangeStart && hoverDate && hoverDate >= rangeStart ? hoverDate : null;

    const selectedDates = useMemo(
        () => (selFrom ? enumerate(selFrom, selTo) : []),
        [selFrom, selTo]
    );
    const inSelection = (date) => selFrom && date >= selFrom && date <= selTo;
    const inPreview = (date) => previewTo && date >= rangeStart && date <= previewTo;

    const selectedBlocked = selectedDates.filter((d) => blocked[d]);
    const selectedFree = selectedDates.filter((d) => !blocked[d]);
    const selectedBooked = selectedFree.filter((d) => (days[d]?.booked || 0) > 0);

    const clearSelection = () => {
        setRangeStart(null);
        setRangeEnd(null);
        setHoverDate(null);
        setReason('');
    };

    const handleDayClick = (date) => {
        if (date < today) return;
        setFeedback(null);
        if (!rangeStart || rangeEnd) {
            setRangeStart(date);
            setRangeEnd(null);
        } else if (date < rangeStart) {
            setRangeEnd(rangeStart);
            setRangeStart(date);
        } else {
            setRangeEnd(date);
        }
    };

    // ── Actions ──────────────────────────────────────────────────────────────
    const handleBlock = async () => {
        if (!selFrom) return;
        // Only the not-yet-blocked stretch matters; blocking again is harmless, but
        // sending the full range keeps the request a single call.
        setSaving(true);
        setFeedback(null);
        try {
            await spProviderApi.blockDates({ from: selFrom, to: selTo, reason: reason.trim() || undefined });
            setFeedback({
                type: 'success',
                message: `${selectedDates.length} day${selectedDates.length > 1 ? 's' : ''} blocked (${prettyDate(selFrom)}${selTo !== selFrom ? ` → ${prettyDate(selTo)}` : ''}).`,
            });
            clearSelection();
            await loadMonth(month, { reset: true });
        } catch (err) {
            const conflicts = err.data?.conflictingDates;
            setFeedback({
                type: 'error',
                message: conflicts?.length
                    ? `${err.message} Conflicting dates: ${conflicts.map(prettyDate).join(', ')}.`
                    : err.message || 'Failed to block dates',
            });
            loadMonth(month, { reset: true });
        } finally {
            setSaving(false);
        }
    };

    const handleUnblock = async () => {
        if (!selectedBlocked.length) return;
        setSaving(true);
        setFeedback(null);
        try {
            await Promise.all(selectedBlocked.map((d) => spProviderApi.unblockDate(blocked[d].id)));
            setFeedback({
                type: 'success',
                message: `${selectedBlocked.length} day${selectedBlocked.length > 1 ? 's' : ''} unblocked — customers can book them again.`,
            });
            clearSelection();
            await loadMonth(month, { reset: true });
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Failed to unblock dates' });
            loadMonth(month, { reset: true });
        } finally {
            setSaving(false);
        }
    };

    // ── Grid ─────────────────────────────────────────────────────────────────
    const [y, m] = month.split('-').map(Number);
    const monthLabel = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const leadingBlanks = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const dayCountInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = Array.from({ length: dayCountInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);

    const cellStyle = (date) => {
        const d = days[date];
        const isBlocked = !!blocked[date];
        const hasBookings = d && d.booked > 0 && !isBlocked;
        const selected = inSelection(date);
        const preview = !selected && inPreview(date);

        if (date < today) return 'bg-gray-50 dark:bg-slate-800/40 text-gray-300 dark:text-slate-600 cursor-not-allowed border-transparent';
        if (selected) {
            return isBlocked
                ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 ring-2 ring-emerald-500 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-100 dark:bg-rose-900/40 border-rose-500 ring-2 ring-rose-500 text-rose-900 dark:text-rose-200';
        }
        if (preview) return 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300';
        if (isBlocked) return 'bg-gray-200 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-300 hover:border-emerald-400';
        if (hasBookings) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:border-amber-500';
        return 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-100 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20';
    };

    const monthBlockedCount = cells.filter((d) => blocked[d]).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">{monthLabel}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            {monthBlockedCount} day{monthBlockedCount !== 1 ? 's' : ''} blocked this month
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setMonth(today.slice(0, 7))}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            aria-label="Previous month"
                            onClick={() => setMonth(shiftMonth(month, -1))}
                            disabled={month <= today.slice(0, 7)}
                            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            aria-label="Next month"
                            onClick={() => setMonth(shiftMonth(month, 1))}
                            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            ›
                        </button>
                    </div>
                </div>

                {loadError && (
                    <div className="mb-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">{loadError}</div>
                )}

                <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                    {WEEKDAYS.map((w) => (
                        <div key={w} className="text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-1">{w}</div>
                    ))}
                </div>

                <div className={`grid grid-cols-7 gap-1.5 transition-opacity ${loading ? 'opacity-60' : ''}`} onMouseLeave={() => setHoverDate(null)}>
                    {Array.from({ length: leadingBlanks }, (_, i) => <div key={`b${i}`} />)}
                    {cells.map((date) => {
                        const d = days[date];
                        const isBlocked = !!blocked[date];
                        const past = date < today;
                        return (
                            <button
                                key={date}
                                type="button"
                                disabled={past}
                                onClick={() => handleDayClick(date)}
                                onMouseEnter={() => setHoverDate(date)}
                                title={isBlocked
                                    ? `Blocked${blocked[date].reason ? ` — ${blocked[date].reason}` : ''}`
                                    : d?.booked > 0 ? `${d.booked} of ${d.total} workers booked` : undefined}
                                className={`relative aspect-square min-h-[3rem] rounded-xl border text-sm font-semibold flex flex-col items-center justify-center transition-all ${cellStyle(date)}`}
                            >
                                <span>{Number(date.slice(8))}</span>
                                {!past && isBlocked && <span className="text-[9px] font-bold uppercase tracking-wide leading-none mt-0.5">Off</span>}
                                {!past && !isBlocked && d?.booked > 0 && (
                                    <span className="text-[9px] font-bold leading-none mt-0.5">{d.booked}/{d.total}</span>
                                )}
                                {date === today && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-gray-300 dark:bg-slate-800 dark:border-slate-600" /> Open</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Has bookings (booked/total)</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-300 dark:bg-slate-600" /> Blocked (off)</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-100 border border-rose-400" /> Selected</span>
                </div>
            </div>

            {/* Action panel */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Block unavailable dates</h4>

                    {feedback && (
                        <div className={`p-3 rounded-xl text-xs font-medium border ${
                            feedback.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}>
                            {feedback.message}
                        </div>
                    )}

                    {!selFrom ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Click a <strong>start date</strong> on the calendar, then an <strong>end date</strong> to
                            select a range. To take off a single day, click it and choose the action below.
                            Click a grey <strong>Off</strong> day to unblock it.
                        </p>
                    ) : (
                        <div className="space-y-3 text-xs">
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600">
                                <div className="font-bold text-gray-900 dark:text-white">
                                    {prettyDate(selFrom)}{selTo !== selFrom && <> → {prettyDate(selTo)}</>}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                                    {selectedDates.length} day{selectedDates.length > 1 ? 's' : ''}
                                    {selectedBlocked.length > 0 && ` • ${selectedBlocked.length} already blocked`}
                                </div>
                                {!rangeEnd && (
                                    <div className="text-[11px] text-gray-400 mt-1">Click another date to extend the range.</div>
                                )}
                            </div>

                            {selectedBooked.length > 0 && (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                                    ⚠️ {selectedBooked.length} selected day{selectedBooked.length > 1 ? 's have' : ' has'} customer bookings
                                    ({selectedBooked.slice(0, 3).map((d) => prettyDate(d)).join(', ')}{selectedBooked.length > 3 ? '…' : ''}).
                                    Cancel those bookings first, or pick different dates.
                                </div>
                            )}

                            {selectedFree.length > 0 && (
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g. Festival, equipment servicing, travel"
                                        maxLength={200}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                    />
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                                {selectedFree.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleBlock}
                                        disabled={saving || selectedBooked.length > 0}
                                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? 'Saving…' : `Block ${selectedFree.length} day${selectedFree.length > 1 ? 's' : ''}`}
                                    </button>
                                )}
                                {selectedBlocked.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleUnblock}
                                        disabled={saving}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Saving…' : `Unblock ${selectedBlocked.length} day${selectedBlocked.length > 1 ? 's' : ''}`}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    disabled={saving}
                                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-slate-700"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* This month's bookings & time off */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">This month</h4>
                    {bookings.length === 0 && monthBlockedCount === 0 ? (
                        <p className="text-xs text-gray-400 italic">No bookings or blocked days.</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {bookings.map((b) => (
                                <div key={b.id} className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-xs">
                                    <div className="font-semibold text-gray-900 dark:text-white">{b.serviceName}</div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                        {prettyDate(String(b.startDate).slice(0, 10))}
                                        {String(b.endDate).slice(0, 10) !== String(b.startDate).slice(0, 10) && ` → ${prettyDate(String(b.endDate).slice(0, 10))}`}
                                        {' • '}{b.workersNeeded} worker{b.workersNeeded > 1 ? 's' : ''}
                                        {b.farmUserName ? ` • ${b.farmUserName}` : ''}
                                    </div>
                                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-white/70 dark:bg-slate-700 text-amber-800 dark:text-amber-300">{b.status}</span>
                                </div>
                            ))}
                            {cells.filter((d) => blocked[d]).map((d) => (
                                <div key={d} className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700/50 text-xs flex items-center justify-between">
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">{prettyDate(d)}</span>
                                    <span className="text-gray-400 italic truncate ml-2">{blocked[d].reason || 'Day off'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SPBlockCalendar;
