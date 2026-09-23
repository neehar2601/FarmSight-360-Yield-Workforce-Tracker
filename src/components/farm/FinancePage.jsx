import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getFinanceSummary,
    getFinanceTransactions,
    getCropFinanceSummary,
    getInventoryActivityBreakdown,
    getActiveCrops
} from '../../utils/farmApi';
import { getFinanceTransactions as getWorkerTransactions, getActivityBreakdown } from '../../utils/workerApi';

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
    </div>
);

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

// ── Summary Card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, color, icon, subtitle, subColor }) => (
    <div className={`bg-white rounded-2xl shadow-md p-6 border-l-4 ${color} flex flex-col justify-between`}>
        <div>
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-2">₹{fmt(value)}</p>
        </div>
        {subtitle && (
            <p className={`text-xs mt-3 font-semibold ${subColor || 'text-gray-400'}`}>
                {subtitle}
            </p>
        )}
    </div>
);

export default function FinancePage() {
    const { currentFarm } = useAuth();
    const [summary, setSummary] = useState(null);
    const [cropFinances, setCropFinances] = useState(null);
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
        const [sumRes, txRes, wTxRes, actRes, invActRes, cropsRes, cropFinRes] = await Promise.all([
            getFinanceSummary(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined, cropFilter),
            getFinanceTransactions(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined, cropFilter),
            getWorkerTransactions(currentFarm.id),
            getActivityBreakdown(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined, cropFilter),
            getInventoryActivityBreakdown(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined, cropFilter),
            getActiveCrops(currentFarm.id),
            getCropFinanceSummary(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined),
        ]);
        setLoading(false);
        if (sumRes.error) { setError(sumRes.error); return; }
        setSummary(sumRes.data);
        setTransactions(txRes.data || []);
        setWorkerTransactions(wTxRes.data || []);
        setActivityBreakdown(actRes.data || []);
        setInvActivityBreakdown(invActRes.data || []);
        setCrops(cropsRes.data || []);
        setCropFinances(cropFinRes.data || null);
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

    // Active crop object and active crop finance record if filtered
    const selectedCropObj = crops.find(c => c.id === selectedCrop);
    const selectedCropFinance = (cropFinances?.crops || []).find(c => c.crop_id === selectedCrop);

    const selectedCropLabel = selectedCrop === 'ALL'
        ? 'All Crops'
        : selectedCrop === 'UNTAGGED'
            ? 'Untagged Work'
            : selectedCropObj ? `${selectedCropObj.name}${selectedCropObj.variety ? ` (${selectedCropObj.variety})` : ''}` : 'Selected Crop';

    // Combine transactions: when a specific crop is selected, only show transactions belonging to that crop
    const rawTransactions = selectedCrop === 'ALL'
        ? [...(transactions || []), ...mappedWorkerTxs]
        : [...(transactions || [])]; // Exclude farm-wide worker salary payouts when viewing a specific crop

    const allTransactions = rawTransactions.sort((a, b) => new Date(b.date_col) - new Date(a.date_col));

    // Summary calculations
    let displayIncome = 0;
    let displayExpense = 0;
    let displayNet = 0;
    let incomeSubtitle = '';
    let expenseSubtitle = '';
    let netSubtitle = '';

    if (selectedCrop === 'ALL') {
        displayIncome = parseFloat(summary?.total_income || 0) + totalWorkerIncome;
        displayExpense = parseFloat(summary?.total_expense || 0) + totalWorkerExpenses;
        displayNet = displayIncome - displayExpense;
        incomeSubtitle = 'Farm-wide total revenue';
        expenseSubtitle = `Includes ₹${fmt(totalWorkerExpenses)} live worker payouts`;
        netSubtitle = displayNet >= 0 ? 'Overall Farm Operating Surplus' : 'Overall Farm Deficit';
    } else if (selectedCrop === 'UNTAGGED') {
        displayIncome = parseFloat(summary?.total_income || 0);
        displayExpense = parseFloat(summary?.total_expense || 0);
        displayNet = displayIncome - displayExpense;
        incomeSubtitle = 'Untagged revenue';
        expenseSubtitle = 'Untagged purchases & usages';
    } else if (selectedCropFinance) {
        displayIncome = selectedCropFinance.total_revenue;
        displayExpense = selectedCropFinance.total_expense;
        displayNet = selectedCropFinance.net_profit;
        incomeSubtitle = `${selectedCropFinance.total_sold_qty} kg sold (${selectedCropFinance.sales_count} sales)`;
        expenseSubtitle = `Labor: ₹${fmt(selectedCropFinance.labor_cost)} · Materials: ₹${fmt(selectedCropFinance.material_cost)}`;
        netSubtitle = selectedCropFinance.profit_margin_pct !== null
            ? `${selectedCropFinance.profit_margin_pct >= 0 ? '+' : ''}${selectedCropFinance.profit_margin_pct}% profit margin`
            : '';
    }

    const filtered = activeTab === 'all'
        ? allTransactions
        : activeTab === 'expense'
            ? allTransactions.filter(t => t.category === 'expense' || t.category === 'adjusted')
            : allTransactions.filter(t => t.category === activeTab);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Finance</h1>
                    <p className="text-gray-500 mt-1">
                        {currentFarm.name} — Crop-level P&amp;L, grade revenue &amp; unified ledger
                    </p>
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

            {/* Crop Selector Toolbar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-1">
                        Select Crop View:
                    </span>
                    <button
                        onClick={() => setSelectedCrop('ALL')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            selectedCrop === 'ALL'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        🌾 All Crops (Farm Overview)
                    </button>
                    {crops.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedCrop(c.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                selectedCrop === c.id
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                            }`}>
                            🌾 {c.name}{c.variety ? ` (${c.variety})` : ''}
                        </button>
                    ))}
                    <button
                        onClick={() => setSelectedCrop('UNTAGGED')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            selectedCrop === 'UNTAGGED'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        }`}>
                        ⚠️ Untagged Only
                    </button>
                </div>

                {selectedCrop !== 'ALL' && (
                    <button
                        onClick={() => setSelectedCrop('ALL')}
                        className="text-xs font-semibold text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-all">
                        ✕ Reset to All Crops
                    </button>
                )}
            </div>

            {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm">{error}</div>}

            {loading ? <Spinner /> : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <SummaryCard
                            label={selectedCrop === 'ALL' ? 'Total Income' : `Crop Revenue (${selectedCropLabel})`}
                            value={displayIncome}
                            color="border-green-500"
                            icon="📈"
                            subtitle={incomeSubtitle}
                            subColor="text-emerald-700"
                        />
                        <SummaryCard
                            label={selectedCrop === 'ALL' ? 'Total Expenses' : `Direct Costs (${selectedCropLabel})`}
                            value={displayExpense}
                            color="border-red-400"
                            icon="📉"
                            subtitle={expenseSubtitle}
                            subColor="text-red-600"
                        />
                        <div className={`bg-white rounded-2xl shadow-md p-6 border-l-4 ${displayNet >= 0 ? 'border-blue-500' : 'border-orange-400'} flex flex-col justify-between`}>
                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500 font-medium">
                                        {selectedCrop === 'ALL' ? 'Net Profit / Loss' : `Crop Net Profit (${selectedCropLabel})`}
                                    </p>
                                    <span className="text-2xl">{displayNet >= 0 ? '✅' : '⚠️'}</span>
                                </div>
                                <p className={`text-3xl font-bold mt-2 ${displayNet >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                    {displayNet >= 0 ? '+' : ''}₹{fmt(displayNet)}
                                </p>
                            </div>
                            {netSubtitle && (
                                <p className={`text-xs mt-3 font-semibold ${displayNet >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {netSubtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 🏷️ Grade-wise Revenue Breakdown — Shown when a specific crop is selected */}
                    {selectedCrop !== 'ALL' && selectedCrop !== 'UNTAGGED' && selectedCropFinance && (
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-100 space-y-4">
                            <div className="flex items-start justify-between flex-wrap gap-2">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <span>🏷️ Grade-wise Sales &amp; Revenue Breakdown</span>
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            {selectedCropFinance.crop_name}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Income tagged to specific grades (e.g. Grade A, Grade B, Unsegregated) with quantities and average selling prices.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 font-medium">Total Crop Revenue</span>
                                    <p className="text-xl font-extrabold text-emerald-700">₹{fmt(selectedCropFinance.total_revenue)}</p>
                                </div>
                            </div>

                            {selectedCropFinance.grade_breakdown.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed">
                                    <p className="text-2xl mb-1">🏷️</p>
                                    <p className="text-sm font-semibold">No crop sales recorded yet for {selectedCropLabel}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">When harvested batches are sold, income and grade will appear here.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                                    {selectedCropFinance.grade_breakdown.map((g, idx) => (
                                        <div key={g.grade || idx} className="bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-sm flex items-center gap-1">
                                                        <span>🏷️</span> {g.grade}
                                                    </span>
                                                    <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                        {g.pct_of_crop_revenue}% revenue
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-800 mt-1">₹{fmt(g.total_amount)}</p>
                                                <p className="text-xs text-gray-600 mt-1.5">
                                                    Sold: <strong className="text-gray-800">{g.quantity} {g.unit}</strong>
                                                    {g.avg_price > 0 && ` @ avg ₹${fmt(g.avg_price)}/${g.unit}`}
                                                </p>
                                            </div>
                                            <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-[11px] text-gray-400">
                                                <span>{g.sales_count} sale record{g.sales_count > 1 ? 's' : ''}</span>
                                                <span className="text-emerald-700 font-semibold">{g.pct_of_crop_revenue}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 🌾 Crop Financial Performance & Profitability Table — Shown in All Crops View */}
                    {selectedCrop === 'ALL' && cropFinances?.crops?.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 space-y-4">
                            <div className="flex items-start justify-between flex-wrap gap-2">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <span>🌾 Crop Financial Performance &amp; Profitability</span>
                                        <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2.5 py-0.5 rounded-full">
                                            Full Crop P&amp;L
                                        </span>
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Track complete finances per crop: Sales revenue vs direct spent (worker wages + input materials/fertilisers/sprays).
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[11px] text-gray-400">Total Crop Net Profit</p>
                                        <p className={`text-base font-extrabold ${cropFinances?.overall?.total_net_profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                            {cropFinances?.overall?.total_net_profit >= 0 ? '+' : ''}₹{fmt(cropFinances?.overall?.total_net_profit || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                            <th className="py-3 px-3">Crop Name</th>
                                            <th className="py-3 px-3">Grades Sold</th>
                                            <th className="py-3 px-3 text-right">Income (Sales)</th>
                                            <th className="py-3 px-3 text-right">Labor Spent</th>
                                            <th className="py-3 px-3 text-right">Materials Spent</th>
                                            <th className="py-3 px-3 text-right">Total Spent</th>
                                            <th className="py-3 px-3 text-right">Net Profit / Loss</th>
                                            <th className="py-3 px-3 text-right">Margin %</th>
                                            <th className="py-3 px-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cropFinances.crops.map(crop => {
                                            const isProfitable = crop.net_profit >= 0;
                                            return (
                                                <tr key={crop.crop_id} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="py-3 px-3 font-semibold text-gray-800">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base">🌾</span>
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm">{crop.crop_name}</p>
                                                                {crop.crop_variety && (
                                                                    <p className="text-[10px] text-gray-400">{crop.crop_variety}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        {crop.grade_breakdown.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {crop.grade_breakdown.map((g, i) => (
                                                                    <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                                                                        {g.grade}: {g.quantity} {g.unit}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-[11px]">No sales recorded</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-extrabold text-emerald-700 text-sm">
                                                        ₹{fmt(crop.total_revenue)}
                                                    </td>
                                                    <td className="py-3 px-3 text-right text-gray-600 font-medium">
                                                        ₹{fmt(crop.labor_cost)}
                                                        {crop.worked_days > 0 && (
                                                            <span className="block text-[10px] text-gray-400">{crop.worked_days} worker-days</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-right text-gray-600 font-medium">
                                                        ₹{fmt(crop.material_cost)}
                                                        {crop.material_use_count > 0 && (
                                                            <span className="block text-[10px] text-gray-400">{crop.material_use_count} usages</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-bold text-gray-800">
                                                        ₹{fmt(crop.total_expense)}
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-bold">
                                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-extrabold ${
                                                            isProfitable
                                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                                : 'bg-red-50 text-red-700 border border-red-200'
                                                        }`}>
                                                            {isProfitable ? '+' : ''}₹{fmt(crop.net_profit)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-semibold">
                                                        {crop.profit_margin_pct !== null ? (
                                                            <span className={crop.profit_margin_pct >= 0 ? 'text-emerald-700 font-bold' : 'text-red-500 font-bold'}>
                                                                {crop.profit_margin_pct > 0 ? '+' : ''}{crop.profit_margin_pct}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <button
                                                            onClick={() => setSelectedCrop(crop.crop_id)}
                                                            className="text-[11px] font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 px-3 py-1.5 rounded-xl transition-all shadow-sm">
                                                            View P&amp;L →
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

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
                                            Labor wages + material consumption attributed at time of use.
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

                    {/* Live Worker Finance Connection Info (Only shown in All Crops view) */}
                    {selectedCrop === 'ALL' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-600 text-2xl">👷</span>
                                <div>
                                    <p className="text-sm font-bold text-emerald-900">Live Worker Service Finance Connected</p>
                                    <p className="text-xs text-emerald-700 mt-0.5">
                                        Total Live Worker Cash Outflows: <strong>₹{fmt(totalWorkerExpenses)}</strong> (Includes Net Payouts, Advances &amp; Bonuses)
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Unified Financial Transactions Ledger */}
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <span>Unified Financial Transactions</span>
                                    {selectedCrop !== 'ALL' && (
                                        <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold px-2.5 py-0.5 rounded-full">
                                            {selectedCropLabel}
                                        </span>
                                    )}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Income tagged with crop &amp; grade · Purchases &amp; usages tagged to crop
                                </p>
                            </div>
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
                                <p>No transactions found {selectedCrop !== 'ALL' ? `for ${selectedCropLabel}` : ''}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filtered.map((tx, i) => (
                                    <div key={tx.id || i} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                                                tx.category === 'income' ? 'bg-green-100'
                                                : tx.category === 'adjusted' ? 'bg-slate-100'
                                                : tx.tx_subtype === 'MATERIAL_USE' ? 'bg-amber-100'
                                                : tx.tx_subtype === 'LABOR_WORK' ? 'bg-blue-100'
                                                : 'bg-red-100'
                                            }`}>
                                                {tx.icon || (
                                                    tx.category === 'income' ? '📈'
                                                    : tx.tx_subtype === 'MATERIAL_USE' ? '🌱'
                                                    : tx.tx_subtype === 'LABOR_WORK' ? '👷'
                                                    : '📉'
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-800 text-sm">{tx.source}</p>

                                                    {/* Transaction Subtype Badge */}
                                                    {tx.tx_subtype === 'MATERIAL_USE' && (
                                                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold text-[10px] border border-amber-200 flex items-center gap-1">
                                                            <span>📦</span> Consumed from Bulk Stock
                                                        </span>
                                                    )}
                                                    {tx.tx_subtype === 'LABOR_WORK' && (
                                                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold text-[10px] border border-blue-200 flex items-center gap-1">
                                                            <span>👷</span> Direct Labor
                                                        </span>
                                                    )}
                                                    {tx.tx_subtype === 'INVENTORY_BUY' && (
                                                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-semibold text-[10px] border border-purple-200 flex items-center gap-1">
                                                            <span>🛒</span> Bulk Purchase
                                                        </span>
                                                    )}

                                                    {/* Activity Type Badge if present */}
                                                    {tx.activity_type && (
                                                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
                                                            {tx.activity_type}
                                                        </span>
                                                    )}

                                                    {/* Crop Tag Badge */}
                                                    {selectedCrop === 'ALL' && tx.crop_name && (
                                                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200 flex items-center gap-1">
                                                            <span>🌾</span> {tx.crop_name}{tx.crop_variety ? ` (${tx.crop_variety})` : ''}
                                                        </span>
                                                    )}

                                                    {/* Grade Tag Badge */}
                                                    {tx.grade && (
                                                        <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-900 font-bold text-[11px] border border-green-300 flex items-center gap-1">
                                                            <span>🏷️</span> {tx.grade}
                                                        </span>
                                                    )}

                                                    {/* Quantity and Unit Price */}
                                                    {tx.quantity && (
                                                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                                                            {parseFloat(tx.quantity)} {tx.unit || 'units'}
                                                            {tx.unit_price ? ` @ ₹${fmt(tx.unit_price)}/${tx.unit || 'unit'}` : ''}
                                                        </span>
                                                    )}

                                                    {/* Buyer Tag */}
                                                    {tx.buyer_name && (
                                                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-medium text-[11px] border border-blue-200">
                                                            👤 {tx.buyer_name}
                                                        </span>
                                                    )}

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
                                        <div className="text-right shrink-0 ml-4">
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
