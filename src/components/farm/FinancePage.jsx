import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFinanceSummary, getFinanceTransactions, getInventoryActivityBreakdown, getActiveCrops } from '../../utils/farmApi';
import { getFinanceTransactions as getWorkerTransactions, getActivityBreakdown } from '../../utils/workerApi';

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
    </div>
);

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

// ── Summary Card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, color, icon }) => (
    <div className={`bg-white rounded-2xl shadow-md p-6 border-l-4 ${color}`}>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-2">₹{fmt(value)}</p>
        <span className="text-2xl mt-2 block">{icon}</span>
    </div>
);

export default function FinancePage() {
    const { currentFarm } = useAuth();
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [workerTransactions, setWorkerTransactions] = useState([]);
    const [activityBreakdown, setActivityBreakdown] = useState([]);     // labor costs per activity
    const [invActivityBreakdown, setInvActivityBreakdown] = useState([]); // material costs per activity
    const [crops, setCrops] = useState([]);
    const [selectedCrop, setSelectedCrop] = useState('ALL'); // 'ALL' | cropId | 'UNTAGGED'
    const [expandedActivities, setExpandedActivities] = useState({}); // { [activity]: boolean }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'income' | 'expense'

    const load = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        setError('');
        const cropFilter = selectedCrop === 'ALL' ? undefined : selectedCrop;
        const [sumRes, txRes, wTxRes, actRes, invActRes, cropsRes] = await Promise.all([
            getFinanceSummary(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined),
            getFinanceTransactions(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined),
            getWorkerTransactions(currentFarm.id),
            getActivityBreakdown(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined, cropFilter),
            getInventoryActivityBreakdown(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined, cropFilter),
            getActiveCrops(currentFarm.id),
        ]);
        setLoading(false);
        if (sumRes.error) { setError(sumRes.error); return; }
        setSummary(sumRes.data);
        setTransactions(txRes.data || []);
        setWorkerTransactions(wTxRes.data || []);
        setActivityBreakdown(actRes.data || []);
        setInvActivityBreakdown(invActRes.data || []);
        setCrops(cropsRes.data || []);
    }, [currentFarm?.id, dateRange.from, dateRange.to, selectedCrop]);

    useEffect(() => { load(); }, [load]);

    if (!currentFarm) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Select a farm to view financials.</p>
        </div>
    );

    // Map live worker transactions into financial ledger items
    const mappedWorkerTxs = workerTransactions.map(t => {
        const isIncome = t.type === 'LOAN_SETTLEMENT';
        const loanDeducted = parseFloat(t.loan_deducted || 0);
        const grossAmount = parseFloat(t.amount || 0);

        let netCashPaid = 0;
        let isFullyAdjusted = false;
        let isPartialAdjusted = false;

        if (t.type === 'PAYOUT') {
            netCashPaid = Math.max(0, grossAmount - loanDeducted);
            if (loanDeducted > 0 && netCashPaid === 0) {
                isFullyAdjusted = true;
            } else if (loanDeducted > 0 && netCashPaid > 0) {
                isPartialAdjusted = true;
            }
        }

        const typeLabel = t.type === 'PAYOUT' ? 'Worker Salary Settlement'
            : t.type === 'ADVANCE' ? 'Worker Cash Advance'
            : t.type === 'BONUS' ? 'Worker Bonus'
            : 'Loan Cash Repayment';

        const icon = t.type === 'PAYOUT'
            ? (isFullyAdjusted ? '🔄' : '💰')
            : t.type === 'ADVANCE' ? '💵'
            : t.type === 'BONUS' ? '🎁'
            : '🤝';

        let notes = t.notes || `${typeLabel} transaction`;
        if (t.type === 'PAYOUT') {
            if (isFullyAdjusted) {
                notes = `Gross Salary ₹${fmt(grossAmount)} • Loan Deducted ₹${fmt(loanDeducted)} • Net Cash Paid ₹0`;
            } else if (isPartialAdjusted) {
                notes = `Gross Salary ₹${fmt(grossAmount)} • Loan Deducted ₹${fmt(loanDeducted)} • Net Cash Paid ₹${fmt(netCashPaid)}`;
            }
        }

        return {
            id: `w_${t.id}`,
            source: `${typeLabel} (${t.worker_name || 'Worker'})`,
            amount: isFullyAdjusted ? grossAmount : (t.type === 'PAYOUT' ? netCashPaid : grossAmount),
            cashAmount: isFullyAdjusted ? 0 : (t.type === 'PAYOUT' ? netCashPaid : grossAmount),
            category: isIncome ? 'income' : (isFullyAdjusted ? 'adjusted' : 'expense'),
            isFullyAdjusted,
            isPartialAdjusted,
            loanDeducted,
            grossAmount,
            icon,
            date_col: t.payment_date || t.created_at,
            notes,
        };
    });

    const totalWorkerExpenses = mappedWorkerTxs
        .filter(t => t.category === 'expense')
        .reduce((sum, t) => sum + (t.cashAmount !== undefined ? t.cashAmount : t.amount), 0);

    const totalWorkerIncome = mappedWorkerTxs
        .filter(t => t.category === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    // Combine live farm transactions + live worker transactions
    const allTransactions = [
        ...(transactions || []),
        ...mappedWorkerTxs,
    ].sort((a, b) => new Date(b.date_col) - new Date(a.date_col));

    const totalIncome = parseFloat(summary?.total_income || 0) + totalWorkerIncome;
    const totalExpense = parseFloat(summary?.total_expense || 0) + totalWorkerExpenses;
    const netProfit = totalIncome - totalExpense;

    const filtered = activeTab === 'all'
        ? allTransactions
        : activeTab === 'expense'
            ? allTransactions.filter(t => t.category === 'expense' || t.category === 'adjusted')
            : allTransactions.filter(t => t.category === activeTab);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Finance</h1>
                    <p className="text-gray-500 mt-1">{currentFarm.name} — P&amp;L overview & ledger</p>
                </div>

                {/* Date range filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <input type="date" value={dateRange.from}
                        onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
                        className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    <span className="text-gray-400 text-sm">to</span>
                    <input type="date" value={dateRange.to}
                        onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
                        className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    {(dateRange.from || dateRange.to) && (
                        <button onClick={() => setDateRange({ from: '', to: '' })}
                            className="text-xs text-gray-500 hover:text-red-500 border rounded-xl px-3 py-2 bg-white">
                            Clear Filter
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm">{error}</div>}

            {loading ? <Spinner /> : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <SummaryCard label="Total Income" value={totalIncome} color="border-green-500" icon="📈" />
                        <SummaryCard label="Total Expenses" value={totalExpense} color="border-red-400" icon="📉" />
                        <div className={`bg-white rounded-2xl shadow-md p-6 border-l-4 ${netProfit >= 0 ? 'border-blue-500' : 'border-orange-400'}`}>
                            <p className="text-sm text-gray-500 font-medium">Net Profit / Loss</p>
                            <p className={`text-3xl font-bold mt-2 ${netProfit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                {netProfit >= 0 ? '+' : ''}₹{fmt(Math.abs(netProfit))}
                            </p>
                            <span className="text-2xl mt-2 block">{netProfit >= 0 ? '✅' : '⚠️'}</span>
                        </div>
                    </div>

                    {/* ⚡ Cost Breakdown by Activity (Labor + Materials combined, with Crop Segregation & Filtering) */}
                    {(() => {
                        const ACTIVITY_EMOJIS = {
                            GENERAL: '👷', PLUCKING: '🌿', FERTILISATION: '🌱',
                            SPRAY: '💦', MULCHING: '🍂', PRUNING: '✂️',
                            SORTING: '📦', IRRIGATION: '💧', UNTAGGED: '🔖',
                        };

                        // Build a merged map: activityType → { labor, materials, workedDays, useCount, crops[], byCrop: {} }
                        const combined = {};
                        const getEntry = (key) => {
                            if (!combined[key]) {
                                combined[key] = { labor: 0, materials: 0, workedDays: 0, useCount: 0, crops: [], byCrop: {} };
                            }
                            return combined[key];
                        };

                        activityBreakdown.forEach(a => {
                            const entry = getEntry(a.activity_type);
                            entry.labor += parseFloat(a.total_labor_cost || 0);
                            entry.workedDays += parseFloat(a.worked_days || 0);
                            (a.crop_breakdown || []).forEach(cb => {
                                const k = cb.crop_id || 'UNTAGGED';
                                if (!entry.byCrop[k]) {
                                    entry.byCrop[k] = {
                                        crop_id: cb.crop_id,
                                        crop_name: cb.crop_name || 'Untagged',
                                        crop_variety: cb.crop_variety,
                                        labor: 0,
                                        materials: 0,
                                        workedDays: 0,
                                        useCount: 0,
                                    };
                                }
                                entry.byCrop[k].labor += parseFloat(cb.labor_cost || 0);
                                entry.byCrop[k].workedDays += parseFloat(cb.worked_days || 0);
                            });
                        });

                        invActivityBreakdown.forEach(a => {
                            const entry = getEntry(a.activity_type);
                            entry.materials += parseFloat(a.total_material_cost || 0);
                            entry.useCount += parseInt(a.use_count || 0);
                            entry.crops = Array.from(new Set([...entry.crops, ...(a.crops || [])]));
                            (a.crop_breakdown || []).forEach(cb => {
                                const k = cb.crop_id || 'UNTAGGED';
                                if (!entry.byCrop[k]) {
                                    entry.byCrop[k] = {
                                        crop_id: cb.crop_id,
                                        crop_name: cb.crop_name || 'Untagged',
                                        crop_variety: cb.crop_variety,
                                        labor: 0,
                                        materials: 0,
                                        workedDays: 0,
                                        useCount: 0,
                                    };
                                }
                                entry.byCrop[k].materials += parseFloat(cb.material_cost || 0);
                                entry.byCrop[k].useCount += parseInt(cb.use_count || 0);
                            });
                        });

                        const entries = Object.entries(combined).sort(
                            ([, a], [, b]) => (b.labor + b.materials) - (a.labor + a.materials)
                        );

                        const toggleExpanded = (act) => {
                            setExpandedActivities(prev => ({ ...prev, [act]: !prev[act] }));
                        };

                        const selectedCropObj = crops.find(c => c.id === selectedCrop);
                        const selectedCropLabel = selectedCrop === 'ALL'
                            ? 'All Crops'
                            : selectedCrop === 'UNTAGGED'
                                ? 'Untagged Work'
                                : selectedCropObj ? `${selectedCropObj.name}${selectedCropObj.variety ? ` (${selectedCropObj.variety})` : ''}` : 'Selected Crop';

                        return (
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 space-y-4">
                                {/* Header & Active Filter Indicator */}
                                <div className="flex items-start justify-between flex-wrap gap-2">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <span>⚡ Cost Breakdown by Activity</span>
                                            {selectedCrop !== 'ALL' && (
                                                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold px-2.5 py-0.5 rounded-full">
                                                    Filtered: {selectedCropLabel}
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Labor wages + material consumption attributed at time of use. Filter or segregate by crop below.
                                        </p>
                                    </div>
                                    {selectedCrop !== 'ALL' && (
                                        <button
                                            onClick={() => setSelectedCrop('ALL')}
                                            className="text-xs font-semibold text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-all">
                                            ✕ Reset Crop Filter
                                        </button>
                                    )}
                                </div>

                                {/* Crop Filter Toolbar */}
                                <div className="pt-2 pb-1 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">
                                        Filter by Crop:
                                    </span>
                                    <button
                                        onClick={() => setSelectedCrop('ALL')}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                            selectedCrop === 'ALL'
                                                ? 'bg-green-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}>
                                        🌾 All Crops
                                    </button>
                                    {crops.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedCrop(c.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                                selectedCrop === c.id
                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                            }`}>
                                            🌾 {c.name}{c.variety ? ` (${c.variety})` : ''}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setSelectedCrop('UNTAGGED')}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                            selectedCrop === 'UNTAGGED'
                                                ? 'bg-amber-500 text-white shadow-sm'
                                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                                        }`}>
                                        ⚠️ Untagged Only
                                    </button>
                                </div>

                                {/* Notice if filtered to a specific crop */}
                                {selectedCrop !== 'ALL' && (
                                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs text-emerald-800 flex items-center justify-between">
                                        <span>
                                            Showing work expenditure specifically attributed to <strong>{selectedCropLabel}</strong>.
                                        </span>
                                        <button
                                            onClick={() => setSelectedCrop('ALL')}
                                            className="text-[11px] underline hover:text-emerald-950 font-bold ml-2">
                                            View all crops
                                        </button>
                                    </div>
                                )}

                                {/* Activity Cards Grid */}
                                {entries.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed">
                                        <p className="text-3xl mb-1.5">🌾</p>
                                        <p className="text-sm font-semibold">No work expenditures recorded {selectedCrop !== 'ALL' ? `for ${selectedCropLabel}` : ''}</p>
                                        {selectedCrop !== 'ALL' && (
                                            <button
                                                onClick={() => setSelectedCrop('ALL')}
                                                className="mt-2 text-xs text-emerald-700 underline font-semibold">
                                                Switch back to All Crops
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {entries.map(([activity, data]) => {
                                            const emoji = ACTIVITY_EMOJIS[activity] || '🔖';
                                            const label = activity.charAt(0) + activity.slice(1).toLowerCase();
                                            const total = data.labor + data.materials;
                                            const laborPct  = total > 0 ? Math.round((data.labor / total) * 100) : 0;
                                            const matPct    = total > 0 ? 100 - laborPct : 0;
                                            const cropList = Object.values(data.byCrop).sort(
                                                (a, b) => (b.labor + b.materials) - (a.labor + a.materials)
                                            );
                                            const isExpanded = !!expandedActivities[activity];

                                            return (
                                                <div key={activity} className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
                                                    <div>
                                                        {/* Header */}
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="text-2xl">{emoji}</span>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-gray-800 text-sm truncate">{label}</p>
                                                                <p className="text-[10px] text-gray-400 truncate">
                                                                    {data.workedDays > 0 && `${data.workedDays} worker-days`}
                                                                    {data.workedDays > 0 && data.useCount > 0 && ' · '}
                                                                    {data.useCount > 0 && `${data.useCount} material usage${data.useCount > 1 ? 's' : ''}`}
                                                                </p>
                                                            </div>
                                                            <p className="ml-auto text-base font-extrabold text-gray-800 shrink-0">₹{fmt(total)}</p>
                                                        </div>

                                                        {/* Sub-rows */}
                                                        <div className="space-y-1.5">
                                                            {data.labor > 0 && (
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="flex items-center gap-1 text-gray-500">
                                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> Labor
                                                                    </span>
                                                                    <span className="font-semibold text-emerald-700">₹{fmt(data.labor)}</span>
                                                                </div>
                                                            )}
                                                            {data.materials > 0 && (
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="flex items-center gap-1 text-gray-500">
                                                                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Materials
                                                                    </span>
                                                                    <span className="font-semibold text-amber-700">₹{fmt(data.materials)}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Mini stacked bar */}
                                                        {total > 0 && (
                                                            <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
                                                                <div className="bg-emerald-400 h-full transition-all" style={{ width: `${laborPct}%` }}></div>
                                                                <div className="bg-amber-400 h-full transition-all" style={{ width: `${matPct}%` }}></div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Crop Segregation / Breakdown Section — only shown in All Crops view */}
                                                    {selectedCrop === 'ALL' && (
                                                        <div className="mt-3 pt-2.5 border-t border-gray-100">
                                                            {cropList.length > 0 ? (
                                                                <div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleExpanded(activity)}
                                                                        className="w-full flex items-center justify-between text-[11px] font-bold text-gray-600 hover:text-emerald-700 transition-colors py-0.5">
                                                                        <span className="flex items-center gap-1">
                                                                            <span>🌾</span> Segregate by Crop ({cropList.length})
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-400">
                                                                            {isExpanded ? '▲ Hide' : '▼ Breakdown'}
                                                                        </span>
                                                                    </button>

                                                                    {/* Expanded Crop Segregation Breakdown */}
                                                                    {isExpanded && (
                                                                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 space-y-1.5 animate-in fade-in duration-150">
                                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                                                Crop-wise Expenditure:
                                                                            </p>
                                                                            {cropList.map(crop => {
                                                                                const cropTotal = crop.labor + crop.materials;
                                                                                const pct = total > 0 ? Math.round((cropTotal / total) * 100) : 0;
                                                                                return (
                                                                                    <div key={crop.crop_id || 'untagged'} className="bg-gray-50/90 rounded-xl p-2 border border-gray-100 text-xs">
                                                                                        <div className="flex items-center justify-between mb-0.5">
                                                                                            <span className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                                                                                                {crop.crop_name === 'Untagged' ? '⚠️' : '🌾'} {crop.crop_name}
                                                                                                {crop.crop_variety ? ` (${crop.crop_variety})` : ''}
                                                                                            </span>
                                                                                            <span className="font-extrabold text-gray-800 text-[11px]">
                                                                                                ₹{fmt(cropTotal)}{' '}
                                                                                                <span className="text-[9px] text-gray-400 font-normal">({pct}%)</span>
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex justify-between text-[10px] text-gray-500">
                                                                                            <span>Labor: <strong className="text-emerald-700">₹{fmt(crop.labor)}</strong></span>
                                                                                            <span>Materials: <strong className="text-amber-700">₹{fmt(crop.materials)}</strong></span>
                                                                                        </div>
                                                                                        {/* Mini percentage bar */}
                                                                                        <div className="mt-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                                                                                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pct}%` }}></div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] text-gray-400 italic">No crop tags recorded</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Legend */}
                                <div className="flex items-center gap-4 pt-2 text-xs text-gray-400 border-t border-gray-100">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> Labor wages</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Material consumption</span>
                                    {selectedCrop === 'ALL' && (
                                        <span className="text-[11px] text-gray-400 ml-auto hidden sm:inline">Click "Segregate by Crop" on any card to view detailed crop split</span>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Live Worker Finance Connection Info */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-emerald-600 text-2xl">👷</span>
                            <div>
                                <p className="text-sm font-bold text-emerald-900">Live Worker Service Finance Connected</p>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                    Total Live Worker Cash Outflows: <strong>₹{fmt(totalWorkerExpenses)}</strong> (Includes Net Payouts, Advances & Bonuses)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transactions table */}
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Unified Financial Transactions</h2>
                            <div className="flex gap-1">
                                {['all', 'income', 'expense'].map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${
                                            activeTab === tab ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                                        }`}>
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <p className="text-4xl mb-3">💸</p>
                                <p>No transactions found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filtered.map((tx, i) => (
                                    <div key={tx.id || i} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                                tx.category === 'income' ? 'bg-green-100'
                                                : tx.category === 'adjusted' ? 'bg-slate-100'
                                                : 'bg-red-100'
                                            }`}>
                                                {tx.icon || (tx.category === 'income' ? '📈' : '📉')}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-800 text-sm">{tx.source}</p>
                                                    {tx.isFullyAdjusted && (
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                                                            Adjusted from Loan
                                                        </span>
                                                    )}
                                                    {tx.isPartialAdjusted && (
                                                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">
                                                            ₹{fmt(tx.loanDeducted)} Loan Deducted
                                                        </span>
                                                    )}
                                                </div>
                                                {tx.notes && <p className="text-xs text-gray-400 mt-0.5">{tx.notes}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {tx.isFullyAdjusted ? (
                                                <div className="flex items-center justify-end">
                                                    <span className="font-bold text-sm text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                                        ₹{fmt(tx.grossAmount)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className={`font-bold text-sm ${tx.category === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {tx.category === 'income' ? '+' : '-'}₹{fmt(tx.amount)}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {tx.date_col ? new Date(tx.date_col).toLocaleDateString('en-IN') : '—'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
