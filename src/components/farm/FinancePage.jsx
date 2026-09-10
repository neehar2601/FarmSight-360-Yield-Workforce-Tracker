import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFinanceSummary, getFinanceTransactions } from '../../utils/farmApi';
import { getFinanceTransactions as getWorkerTransactions } from '../../utils/workerApi';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'income' | 'expense'

    const load = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        setError('');
        const [sumRes, txRes, wTxRes] = await Promise.all([
            getFinanceSummary(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined),
            getFinanceTransactions(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined),
            getWorkerTransactions(currentFarm.id),
        ]);
        setLoading(false);
        if (sumRes.error) { setError(sumRes.error); return; }
        setSummary(sumRes.data);
        setTransactions(txRes.data || []);
        setWorkerTransactions(wTxRes.data || []);
    }, [currentFarm?.id, dateRange.from, dateRange.to]);

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

        // Net cash outflow/inflow for this transaction
        // For PAYOUT: cash paid out = gross payout amount - loan deduction
        const amt = t.type === 'PAYOUT'
            ? Math.max(0, parseFloat(t.amount || 0) - loanDeducted)
            : parseFloat(t.amount || 0);

        const typeLabel = t.type === 'PAYOUT' ? 'Worker Payout (Cash Paid)'
            : t.type === 'ADVANCE' ? 'Worker Advance'
            : t.type === 'BONUS' ? 'Worker Bonus'
            : 'Loan Repayment Recovery';

        let notes = t.notes || `${typeLabel} transaction`;
        if (t.type === 'PAYOUT' && loanDeducted > 0) {
            notes = `Gross ₹${parseFloat(t.amount || 0).toLocaleString('en-IN')}, Loan Deducted ₹${loanDeducted.toLocaleString('en-IN')}${t.notes ? ` • ${t.notes}` : ''}`;
        }

        return {
            id: `w_${t.id}`,
            source: `${typeLabel} (${t.worker_name || 'Worker'})`,
            amount: amt,
            category: isIncome ? 'income' : 'expense',
            date_col: t.payment_date || t.created_at,
            notes,
        };
    });

    const totalWorkerExpenses = mappedWorkerTxs
        .filter(t => t.category === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

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

                    {/* Live Worker Finance Connection Info */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-emerald-600 text-2xl">👷</span>
                            <div>
                                <p className="text-sm font-bold text-emerald-900">Live Worker Service Finance Connected</p>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                    Total Live Worker Expenses: <strong>₹{fmt(totalWorkerExpenses)}</strong> (Includes Payouts, Advances & Bonuses)
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
                                                tx.category === 'income' ? 'bg-green-100' : 'bg-red-100'
                                            }`}>
                                                {tx.category === 'income' ? '📈' : '📉'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{tx.source}</p>
                                                {tx.notes && <p className="text-xs text-gray-400">{tx.notes}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-sm ${tx.category === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                                {tx.category === 'income' ? '+' : '-'}₹{fmt(tx.amount)}
                                            </p>
                                            <p className="text-xs text-gray-400">
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
