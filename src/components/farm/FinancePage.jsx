import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFinanceSummary, getFinanceTransactions } from '../../utils/farmApi';

// ── Mock worker finance data (will be replaced by Worker Service) ──────────────
const MOCK_WORKER_FINANCE = {
    totalWages: 48500,
    transactions: [
        { id: 'w1', source: 'Worker Wages', amount: 48500, category: 'expense', date_col: '2025-10-13', notes: 'Weekly payroll — 5 workers' },
        { id: 'w2', source: 'Worker Wages', amount: 4800, category: 'expense', date_col: '2025-10-06', notes: 'Weekly payroll' },
        { id: 'w3', source: 'Worker Wages', amount: 900, category: 'expense', date_col: '2025-10-10', notes: 'Advance to Ramesh Kumar' },
    ]
};

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'income' | 'expense'

    const load = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        setError('');
        const [sumRes, txRes] = await Promise.all([
            getFinanceSummary(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined),
            getFinanceTransactions(currentFarm.id, dateRange.from || undefined, dateRange.to || undefined),
        ]);
        setLoading(false);
        if (sumRes.error) { setError(sumRes.error); return; }
        setSummary(sumRes.data);
        setTransactions(txRes.data || []);
    }, [currentFarm?.id, dateRange.from, dateRange.to]);

    useEffect(() => { load(); }, [load]);

    if (!currentFarm) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Select a farm to view financials.</p>
        </div>
    );

    // Merge live transactions with mock worker data for unified ledger
    const allTransactions = [
        ...( transactions || []),
        ...MOCK_WORKER_FINANCE.transactions,
    ].sort((a, b) => new Date(b.date_col) - new Date(a.date_col));

    const workerExpenses = MOCK_WORKER_FINANCE.totalWages;
    const totalIncome = parseFloat(summary?.total_income || 0);
    const totalExpense = parseFloat(summary?.total_expense || 0) + workerExpenses;
    const netProfit = totalIncome - totalExpense;

    const filtered = activeTab === 'all'
        ? allTransactions
        : allTransactions.filter(t => t.category === activeTab);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Finance</h1>
                    <p className="text-gray-500 mt-1">{currentFarm.name} — P&amp;L overview</p>
                </div>

                {/* Date range filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <input type="date" value={dateRange.from}
                        onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
                        className="border border-gray-300 rounded-xl px-3 py-2 text-sm" />
                    <span className="text-gray-400 text-sm">to</span>
                    <input type="date" value={dateRange.to}
                        onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
                        className="border border-gray-300 rounded-xl px-3 py-2 text-sm" />
                    {(dateRange.from || dateRange.to) && (
                        <button onClick={() => setDateRange({ from: '', to: '' })}
                            className="text-xs text-gray-500 hover:text-red-500 border rounded-xl px-2 py-2">
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">{error}</div>}

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

                    {/* Worker finance note */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <span className="text-amber-500 text-xl">🚧</span>
                        <div>
                            <p className="text-sm font-semibold text-amber-800">Worker Expenses: Demo Data</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Worker wages (₹{fmt(workerExpenses)}) are shown from mock data. They will be replaced with live data once the Worker Service is connected.
                            </p>
                        </div>
                    </div>

                    {/* Transactions table */}
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800">Transactions</h2>
                            <div className="flex gap-1">
                                {['all', 'income', 'expense'].map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                                            activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
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
                            <div className="divide-y divide-gray-50">
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
