import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getWorkersOverview, getInactiveWorkers, createWorker,
    updateWorker, setWorkerStatus, upsertAttendance,
    getAttendance, recordAdvance, recordBonus, recordLoanSettlement,
    processPayout, getFinanceTransactions,
} from '../../utils/workerApi';
import { getActiveCrops } from '../../utils/farmApi';

// ─── helpers ──────────────────────────────────────────────────────────────────
const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurr = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const TX_TYPE_BADGES = {
    ADVANCE: 'bg-amber-100 text-amber-800 border-amber-200',
    LOAN_SETTLEMENT: 'bg-blue-100 text-blue-800 border-blue-200',
    BONUS: 'bg-purple-100 text-purple-800 border-purple-200',
    PAYOUT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

// ─── Activity Types ───────────────────────────────────────────────────────────
const ACTIVITY_TYPES = [
    { value: 'GENERAL',      label: 'General',       emoji: '👷' },
    { value: 'PLUCKING',     label: 'Plucking',      emoji: '🌿' },
    { value: 'FERTILISATION',label: 'Fertilisation', emoji: '🌱' },
    { value: 'SPRAY',        label: 'Spraying',      emoji: '💦' },
    { value: 'MULCHING',     label: 'Mulching',      emoji: '🍂' },
    { value: 'PRUNING',      label: 'Pruning',       emoji: '✂️' },
    { value: 'SORTING',      label: 'Sorting',       emoji: '📦' },
    { value: 'IRRIGATION',   label: 'Irrigation',    emoji: '💧' },
];
const ACTIVITY_MAP = Object.fromEntries(ACTIVITY_TYPES.map(a => [a.value, a]));

// ─── WorkerModal ──────────────────────────────────────────────────────────────
const WorkerModal = ({ worker, farmId, onClose, onSaved }) => {
    const editing = !!worker;
    const [form, setForm] = useState({
        name: worker?.name || '',
        role: worker?.role || '',
        contact: worker?.contact || '',
        per_day_salary: worker?.per_day_salary || '',
        skills: worker?.skills || '',
    });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setErr('Name is required'); return; }
        setLoading(true); setErr('');
        const body = {
            ...form, farm_id: farmId,
            per_day_salary: parseFloat(form.per_day_salary) || 0
        };
        const { data, error } = editing
            ? await updateWorker(worker.id, body)
            : await createWorker(body);
        setLoading(false);
        if (error) { setErr(error); return; }
        onSaved(data, editing);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {editing ? '✏️ Edit Worker' : '👷 Add Worker'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{err}</p>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name *</label>
                            <input value={form.name} onChange={set('name')} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Ramesh Kumar" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Role</label>
                            <input value={form.role} onChange={set('role')} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Harvester" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Contact</label>
                            <input value={form.contact} onChange={set('contact')} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. 9876543210" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Daily Wage (₹)</label>
                            <input type="number" min="0" step="0.01" value={form.per_day_salary} onChange={set('per_day_salary')} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. 600" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-1">Skills</label>
                            <textarea rows={2} value={form.skills} onChange={set('skills')} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" placeholder="e.g. Harvesting, Sorting" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border text-gray-600 hover:bg-gray-50 font-semibold text-sm">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
                            {loading ? 'Saving…' : editing ? 'Save Changes' : 'Add Worker'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── ArchiveModal ─────────────────────────────────────────────────────────────
const ArchiveModal = ({ worker, farmId, onClose, onArchived }) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const handleArchive = async () => {
        setLoading(true); setErr('');
        const { error } = await setWorkerStatus(worker.id, {
            farm_id: farmId, is_active: false, inactive_notes: notes,
        });
        setLoading(false);
        if (error) { setErr(error); return; }
        onArchived(worker.id);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-1">📦 Archive Worker</h2>
                <p className="text-gray-500 text-sm mb-5">
                    <strong>{worker.name}</strong> will be moved to the Inactive list. You can re-activate them anytime.
                </p>
                {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mb-4">{err}</p>}
                <label className="block text-sm font-semibold text-gray-600 mb-1">Reason / Notes (optional)</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    placeholder="e.g. Season ended, expected return March 2027" />
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border text-gray-600 hover:bg-gray-50 font-semibold text-sm">Cancel</button>
                    <button onClick={handleArchive} disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors disabled:opacity-60">
                        {loading ? 'Archiving…' : 'Archive Worker'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── BonusModal ───────────────────────────────────────────────────────────────
const BonusModal = ({ worker, farmId, onClose, onRecorded }) => {
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(today());
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            setErr('Please enter a valid bonus amount');
            return;
        }
        setLoading(true); setErr('');
        const { data, error } = await recordBonus({
            worker_id: worker.id, farm_id: farmId, amount: parseFloat(amount),
            payment_date: paymentDate, payment_mode: paymentMode, notes
        });
        setLoading(false);
        if (error) { setErr(error); return; }
        onRecorded(data);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">🎁 Award Bonus to {worker.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{err}</p>}
                    <p className="text-xs text-gray-500">
                        Bonus awards automatically add to the worker's carryforward salary balance.
                    </p>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Bonus Amount (₹) *</label>
                        <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="e.g. 500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Mode</label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white">
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI / GPay</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                        <input value={notes} onChange={(e) => setNotes(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="e.g. Festival bonus / Harvest target reward" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                            {loading ? 'Awarding…' : 'Award Bonus'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── AdvanceModal ─────────────────────────────────────────────────────────────
const AdvanceModal = ({ worker, farmId, onClose, onRecorded }) => {
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(today());
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            setErr('Please enter a valid advance amount');
            return;
        }
        setLoading(true); setErr('');
        const { data, error } = await recordAdvance({
            worker_id: worker.id, farm_id: farmId, amount: parseFloat(amount),
            payment_date: paymentDate, payment_mode: paymentMode, notes
        });
        setLoading(false);
        if (error) { setErr(error); return; }
        onRecorded(data);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">💵 Issue Advance to {worker.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{err}</p>}
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
                        Current Outstanding Loan Balance: <strong>{fmtCurr(worker.loan_balance)}</strong>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Advance Amount (₹) *</label>
                        <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder="e.g. 1000" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Mode</label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white">
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI / GPay</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                        <input value={notes} onChange={(e) => setNotes(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder="e.g. Advance for personal need" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                            {loading ? 'Recording…' : 'Issue Advance'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── LoanSettlementModal ──────────────────────────────────────────────────────
const LoanSettlementModal = ({ worker, farmId, onClose, onRecorded }) => {
    const [amount, setAmount] = useState(worker.loan_balance || '');
    const [paymentDate, setPaymentDate] = useState(today());
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            setErr('Please enter a valid settlement amount');
            return;
        }
        setLoading(true); setErr('');
        const { data, error } = await recordLoanSettlement({
            worker_id: worker.id, farm_id: farmId, amount: parseFloat(amount),
            payment_date: paymentDate, payment_mode: paymentMode, notes
        });
        setLoading(false);
        if (error) { setErr(error); return; }
        onRecorded(data);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">🤝 Loan Settlement for {worker.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{err}</p>}
                    <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl">
                        Current Outstanding Loan Balance: <strong>{fmtCurr(worker.loan_balance)}</strong>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Repayment Amount (₹) *</label>
                        <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Repayment Mode</label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI / GPay</option>
                                <option value="LABOR_ADJUSTMENT">Labor Adjustment</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                        <input value={notes} onChange={(e) => setNotes(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. Cash returned by worker" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                            {loading ? 'Recording…' : 'Record Settlement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── PayoutModal ──────────────────────────────────────────────────────────────
const PayoutModal = ({ worker, farmId, onClose, onPaid }) => {
    const [payoutAmount, setPayoutAmount] = useState(worker.unpaid_carryforward_salary || 0);
    const [loanDeduct, setLoanDeduct] = useState(
        Math.min(worker.loan_balance || 0, worker.unpaid_carryforward_salary || 0)
    );
    const [paymentDate, setPaymentDate] = useState(today());
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const netPayable = Math.max(0, parseFloat(payoutAmount || 0) - parseFloat(loanDeduct || 0));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(payoutAmount || 0);
        const deduct = parseFloat(loanDeduct || 0);

        if (amt <= 0 && deduct <= 0) {
            setErr('Payout amount or loan deduction must be greater than zero');
            return;
        }

        setLoading(true); setErr('');
        const { data, error } = await processPayout({
            worker_id: worker.id,
            farm_id: farmId,
            amount: amt,
            loan_deducted: deduct,
            payment_date: paymentDate,
            payment_mode: paymentMode,
            notes,
        });

        setLoading(false);
        if (error) { setErr(error); return; }
        onPaid(data);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center pb-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">💰 Pay Salary to {worker.name}</h2>
                        <p className="text-xs text-gray-500">Unpaid Carryforward Salary Settlement</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{err}</p>}

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-emerald-800">Total Days Worked:</span>
                            <span className="font-bold text-emerald-900">{worker.total_days_worked} days</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-emerald-800">Gross Earned + Bonuses:</span>
                            <span className="font-bold text-emerald-900">{fmtCurr(worker.total_gross_earned + worker.total_bonus)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-emerald-200">
                            <span className="text-emerald-800 font-semibold">Unpaid Carryforward Salary:</span>
                            <span className="font-extrabold text-emerald-900 text-sm">{fmtCurr(worker.unpaid_carryforward_salary)}</span>
                        </div>
                        <div className="flex justify-between text-amber-700 pt-1">
                            <span>Outstanding Loan Owed:</span>
                            <span className="font-bold">{fmtCurr(worker.loan_balance)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Payout Settlement Amount (₹)</label>
                            <input type="number" min="0" step="0.01" value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Deduct from Loan (₹)</label>
                            <input type="number" min="0" max={worker.loan_balance} step="0.01"
                                value={loanDeduct} onChange={(e) => setLoanDeduct(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Mode</label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI / GPay / PhonePe</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Date</label>
                            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Net Cash Paid to Worker</label>
                            <div className="w-full bg-emerald-100 border border-emerald-300 rounded-xl px-3 py-2 text-sm font-bold text-emerald-800">
                                {fmtCurr(netPayable)}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                            <input value={notes} onChange={(e) => setNotes(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                placeholder="e.g. Weekly salary settlement" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                            {loading ? 'Processing…' : 'Confirm Payout'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── AllInOneWorkerCard ───────────────────────────────────────────────────────
const AllInOneWorkerCard = ({
    worker, farmId, crops, onMarkAttendance, onEdit, onArchive,
    onPaySalary, onAdvance, onBonus, onSettleLoan
}) => {
    const [savingAtt, setSavingAtt] = useState(false);
    const [activityType, setActivityType] = useState(worker.today_activity_type || 'GENERAL');
    const [cropId, setCropId] = useState(worker.today_crop_id || '');
    const todayStr = today();

    // Sync activity/crop if the worker prop changes (e.g., after reload)
    useEffect(() => {
        setActivityType(worker.today_activity_type || 'GENERAL');
        setCropId(worker.today_crop_id || '');
    }, [worker.today_activity_type, worker.today_crop_id]);

    const handleAttendance = async (status) => {
        setSavingAtt(true);
        const finalActivity = status === 'A' ? 'GENERAL' : activityType;
        const finalCropId = status === 'A' ? null : (cropId || null);
        await onMarkAttendance(worker.id, status, finalActivity, finalCropId);
        setSavingAtt(false);
    };

    const handleActivityChange = async (newActivity) => {
        setActivityType(newActivity);
        // If already marked P or H today, immediately persist the change
        if (worker.today_status && worker.today_status !== 'A') {
            setSavingAtt(true);
            await onMarkAttendance(worker.id, worker.today_status, newActivity, cropId || null);
            setSavingAtt(false);
        }
    };

    const handleCropChange = async (newCropId) => {
        setCropId(newCropId);
        // If already marked P or H today, immediately persist the change
        if (worker.today_status && worker.today_status !== 'A') {
            setSavingAtt(true);
            await onMarkAttendance(worker.id, worker.today_status, activityType, newCropId || null);
            setSavingAtt(false);
        }
    };

    const actInfo = ACTIVITY_MAP[activityType] || ACTIVITY_MAP['GENERAL'];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 text-white flex items-center justify-center text-xl font-extrabold shadow-sm shrink-0">
                        {worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-base">{worker.name}</h3>
                        <p className="text-xs text-gray-500">{worker.role || 'General Farm Hand'} {worker.contact ? `• 📞 ${worker.contact}` : ''}</p>
                        <p className="text-xs font-semibold text-gray-600 mt-0.5">💰 Daily Wage: {fmtCurr(worker.per_day_salary)}/day</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(worker)} className="px-2.5 py-1 text-xs border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors font-medium flex items-center gap-1">
                        ✏️ Edit
                    </button>
                    <button onClick={() => onArchive(worker)} className="px-2.5 py-1 text-xs border border-amber-300 hover:border-amber-500 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors font-medium flex items-center gap-1">
                        📦 Archive
                    </button>
                </div>
            </div>

            {/* Quick Attendance Bar for Today */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        📋 Today's Attendance {savingAtt && <span className="text-[10px] text-gray-400 font-normal">(Saving…)</span>}
                    </span>
                    <div className="flex gap-1.5">
                        {[
                            { s: 'P', label: 'P', name: 'Present', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
                            { s: 'H', label: 'H', name: 'Half Day', activeClass: 'bg-amber-500 text-white border-amber-500' },
                            { s: 'A', label: 'A', name: 'Absent', activeClass: 'bg-rose-600 text-white border-rose-600' },
                        ].map(btn => (
                            <button key={btn.s} onClick={() => handleAttendance(btn.s)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                                    worker.today_status === btn.s
                                        ? btn.activeClass
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                                }`}>
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Activity Selector + Crop Tagger — shown when unmarked or marked P/H (hidden only when Absent) */}
                {worker.today_status !== 'A' && (
                    <div className="space-y-2 pt-1 border-t border-gray-200">
                        {/* Activity pills */}
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">📌 Task:</span>
                            <div className="flex flex-wrap gap-1">
                                {ACTIVITY_TYPES.map(act => (
                                    <button
                                        key={act.value}
                                        type="button"
                                        onClick={() => handleActivityChange(act.value)}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                                            activityType === act.value
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700'
                                        }`}>
                                        {act.emoji} {act.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Crop dropdown — only if farm has active crops */}
                        {crops && crops.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">🌾 Crop:</span>
                                <select
                                    value={cropId || ''}
                                    onChange={e => handleCropChange(e.target.value)}
                                    className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:border-green-400 focus:outline-none">
                                    <option value="">No specific crop</option>
                                    {crops.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}{c.variety ? ` (${c.variety})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Realtime Financial Metric Badges */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
                    <p className="text-gray-500 font-medium text-[11px]">Unpaid Carryforward Salary</p>
                    <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                        {fmtCurr(worker.unpaid_carryforward_salary)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{worker.total_days_worked} worked days</p>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3">
                    <p className="text-gray-500 font-medium text-[11px]">Outstanding Loan Owed</p>
                    <p className={`text-base font-extrabold mt-0.5 ${worker.loan_balance > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                        {fmtCurr(worker.loan_balance)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Active advances</p>
                </div>
            </div>

            {/* Direct Quick Action Buttons Bar */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                    disabled={worker.unpaid_carryforward_salary <= 0}
                    onClick={() => onPaySalary(worker)}
                    className={`font-semibold py-2 px-1 text-center text-xs rounded-xl transition-colors shadow-sm ${
                        worker.unpaid_carryforward_salary <= 0
                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}>
                    💰 Pay Salary
                </button>
                <button onClick={() => onAdvance(worker)}
                    className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 font-semibold py-2 px-1 text-center text-xs rounded-xl transition-colors">
                    💵 Advance
                </button>
                <button onClick={() => onBonus(worker)}
                    className="bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-800 font-semibold py-2 px-1 text-center text-xs rounded-xl transition-colors">
                    🎁 Bonus
                </button>
                <button onClick={() => onSettleLoan(worker)}
                    className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 font-semibold py-2 px-1 text-center text-xs rounded-xl transition-colors">
                    🤝 Settle Loan
                </button>
            </div>
        </div>
    );
};

// ─── CellEditPopover ─────────────────────────────────────────────────────────
// Compact floating panel for editing a single day's attendance entry.
const CellEditPopover = ({ worker, date, cell, crops, farmId, onSaved, onClose }) => {
    const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short'
    });
    const [status,   setStatus]   = useState(cell?.status   || 'P');
    const [activity, setActivity] = useState(cell?.activity || 'GENERAL');
    const [cropId,   setCropId]   = useState(cell?.cropId   || '');
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState('');

    const save = async () => {
        setSaving(true);
        setError('');
        const res = await upsertAttendance({
            worker_id:     worker.id,
            farm_id:       farmId,
            date,
            status,
            activity_type: status === 'A' ? 'GENERAL' : activity,
            crop_id:       status === 'A' ? null : (cropId || null),
        });
        setSaving(false);
        if (res?.error) {
            setError(res.error);
            return;
        }
        onSaved();
    };

    const clear = async () => {
        // Marking absent effectively clears activity / crop
        setSaving(true);
        setError('');
        const res = await upsertAttendance({
            worker_id: worker.id, farm_id: farmId, date,
            status: 'A', activity_type: 'GENERAL', crop_id: null,
        });
        setSaving(false);
        if (res?.error) {
            setError(res.error);
            return;
        }
        onSaved();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-gray-800 text-sm">{worker.name}</p>
                        <p className="text-xs text-gray-400">{dateLabel}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
                </div>

                {error && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                        {error}
                    </div>
                )}

                {/* Status */}
                <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Attendance</p>
                    <div className="flex gap-2">
                        {[
                            { s: 'P', label: 'Present',  cls: 'bg-emerald-500 text-white border-emerald-500' },
                            { s: 'H', label: 'Half Day', cls: 'bg-amber-400 text-white border-amber-400' },
                            { s: 'A', label: 'Absent',   cls: 'bg-rose-500 text-white border-rose-500' },
                        ].map(btn => (
                            <button key={btn.s} onClick={() => setStatus(btn.s)}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                    status === btn.s ? btn.cls : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                                }`}>
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Activity + Crop — hidden when Absent */}
                {status !== 'A' && (
                    <>
                        <div>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">📌 Activity</p>
                            <div className="flex flex-wrap gap-1">
                                {ACTIVITY_TYPES.map(act => (
                                    <button key={act.value} onClick={() => setActivity(act.value)}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                                            activity === act.value
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                                        }`}>
                                        {act.emoji} {act.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {crops && crops.length > 0 && (
                            <div>
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">🌾 Crop</p>
                                <select value={cropId} onChange={e => setCropId(e.target.value)}
                                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:border-green-400 focus:outline-none">
                                    <option value="">No specific crop</option>
                                    {crops.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}{c.variety ? ` (${c.variety})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button onClick={onClose}
                        className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={save} disabled={saving}
                        className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                        {saving ? 'Saving…' : '✓ Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── MonthlyAttendance ────────────────────────────────────────────────────────
const MonthlyAttendance = ({ workers, farmId, crops, onReloadWorkers }) => {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [month,   setMonth]   = useState(defaultMonth);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    // editing: { worker, date, cell } | null
    const [editing, setEditing] = useState(null);

    const loadRecords = useCallback(() => {
        if (!farmId || !month) return;
        setLoading(true);
        getAttendance(farmId, month).then(({ data }) => {
            setRecords(data || []);
            setLoading(false);
        });
    }, [farmId, month]);

    useEffect(() => { loadRecords(); }, [loadRecords]);

    // Build calendar: days in month
    const [year, mon] = month.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Determine today so we can grey out / lock future days
    const nowObj = new Date();
    const todayYear  = nowObj.getFullYear();
    const todayMonth = nowObj.getMonth() + 1; // 1-based
    const todayDay   = nowObj.getDate();
    const isFutureDay = (d) =>
        year > todayYear ||
        (year === todayYear && mon > todayMonth) ||
        (year === todayYear && mon === todayMonth && d > todayDay);

    // Map: { workerId: { dayNum: { status, activity, cropId } } }
    const attMap = {};
    records.forEach(r => {
        if (!attMap[r.worker_id]) attMap[r.worker_id] = {};
        const dateStr = typeof r.date === 'string' ? r.date.split('T')[0] : '';
        const dayNum = dateStr ? parseInt(dateStr.split('-')[2], 10) : new Date(r.date).getDate();
        if (dayNum) {
            attMap[r.worker_id][dayNum] = {
                status:   r.status,
                activity: r.activity_type,
                cropId:   r.crop_id,
            };
        }
    });

    const STATUS_STYLE = {
        P: 'bg-emerald-500 text-white',
        H: 'bg-amber-400 text-white',
        A: 'bg-rose-400 text-white',
    };

    // Monthly summary per worker
    const summary = workers.map(w => {
        const wAtt = attMap[w.id] || {};
        const p = Object.values(wAtt).filter(v => v.status === 'P').length;
        const h = Object.values(wAtt).filter(v => v.status === 'H').length;
        const a = Object.values(wAtt).filter(v => v.status === 'A').length;
        const worked = p * 1.0 + h * 0.5;
        const earned = worked * parseFloat(w.per_day_salary || 0);
        return { ...w, p, h, a, worked, earned };
    });

    return (
        <div className="space-y-5">
            {/* Month Picker + Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-800 text-base">📅 Monthly Attendance Roster</h3>
                    <input
                        type="month" value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="border rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-500 inline-block"></span> Present</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-amber-400 inline-block"></span> Half Day</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-rose-400 inline-block"></span> Absent</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-200 inline-block"></span> Not Marked</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading attendance…</div>
            ) : workers.length === 0 ? (
                <div className="text-center py-10 text-gray-400">No active workers to display.</div>
            ) : (
                <>
                    {/* Calendar Grid */}
                    <div className="overflow-x-auto rounded-2xl border border-gray-200">
                        <table className="text-[11px] w-full border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="sticky left-0 bg-gray-50 z-10 p-2.5 text-left font-semibold text-gray-600 border-b border-r border-gray-200 min-w-[120px]">Worker</th>
                                    {days.map(d => {
                                        const date = new Date(year, mon - 1, d);
                                        const dow = date.getDay();
                                        const isSun = dow === 0;
                                        const isSat = dow === 6;
                                        const future = isFutureDay(d);
                                        return (
                                            <th key={d} className={`p-1.5 text-center font-semibold border-b border-gray-200 min-w-[28px] ${
                                                future      ? 'text-gray-300 bg-gray-50'
                                                : isSun     ? 'text-rose-500 bg-rose-50'
                                                : isSat     ? 'text-amber-600 bg-amber-50'
                                                            : 'text-gray-500'
                                            }`}>
                                                <div>{d}</div>
                                                <div className="text-[9px] font-normal">{['Su','Mo','Tu','We','Th','Fr','Sa'][dow]}</div>
                                            </th>
                                        );
                                    })}
                                    <th className="p-2.5 text-center font-semibold text-gray-600 border-b border-l border-gray-200 whitespace-nowrap">P</th>
                                    <th className="p-2.5 text-center font-semibold text-gray-600 border-b border-gray-200">H</th>
                                    <th className="p-2.5 text-center font-semibold text-gray-600 border-b border-gray-200">Days</th>
                                    <th className="p-2.5 text-center font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">Earned (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {summary.map(w => (
                                    <tr key={w.id} className="hover:bg-gray-50">
                                        <td className="sticky left-0 bg-white z-10 p-2.5 font-semibold text-gray-800 border-r border-gray-200 whitespace-nowrap">
                                            {w.name}
                                            <p className="text-[10px] text-gray-400 font-normal">{fmtCurr(w.per_day_salary)}/day</p>
                                        </td>
                                        {days.map(d => {
                                            const cell = attMap[w.id]?.[d];
                                            const actInfo = cell?.activity ? ACTIVITY_MAP[cell.activity] : null;
                                            const dateStr = `${year}-${String(mon).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                                            const cropName = cell?.cropId
                                                ? crops?.find(c => c.id === cell.cropId)?.name
                                                : null;
                                            const future = isFutureDay(d);
                                            const tooltip = future
                                                ? 'Future date — cannot mark attendance'
                                                : [
                                                    cell ? (cell.status === 'P' ? 'Present' : cell.status === 'H' ? 'Half Day' : 'Absent') : 'Not marked',
                                                    actInfo ? `${actInfo.emoji} ${actInfo.label}` : null,
                                                    cropName ? `🌾 ${cropName}` : null,
                                                  ].filter(Boolean).join(' · ');
                                            return (
                                                <td key={d} className="p-0.5 text-center">
                                                    <button
                                                        title={tooltip}
                                                        disabled={future}
                                                        onClick={() => { if (!future) setEditing({ worker: w, date: dateStr, cell }); }}
                                                        className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center text-[10px] font-bold transition-all ${
                                                            future
                                                                ? 'bg-gray-50 text-gray-200 cursor-not-allowed'
                                                                : cell
                                                                    ? `${STATUS_STYLE[cell.status] || 'bg-gray-200 text-gray-400'} hover:ring-2 hover:ring-offset-1 hover:ring-green-400`
                                                                    : 'bg-gray-100 hover:bg-gray-200 hover:ring-2 hover:ring-offset-1 hover:ring-green-400'
                                                        }`}>
                                                        {future ? null : cell ? (
                                                            actInfo ? actInfo.emoji : cell.status
                                                        ) : (
                                                            <span className="text-gray-300">·</span>
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                        <td className="p-2.5 text-center font-bold text-emerald-700">{w.p}</td>
                                        <td className="p-2.5 text-center font-bold text-amber-600">{w.h}</td>
                                        <td className="p-2.5 text-center font-bold text-gray-700">{w.worked}</td>
                                        <td className="p-2.5 text-center font-bold text-emerald-700">{fmtCurr(w.earned)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid sm:grid-cols-3 gap-3">
                        {summary.map(w => (
                            <div key={w.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                                <p className="font-bold text-gray-800 text-sm">{w.name}</p>
                                <p className="text-xs text-gray-500 mb-2">{w.role || 'General Farm Hand'}</p>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-emerald-50 rounded-xl p-2">
                                        <p className="text-lg font-extrabold text-emerald-700">{w.p}</p>
                                        <p className="text-[10px] text-gray-500">Present</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-2">
                                        <p className="text-lg font-extrabold text-amber-600">{w.h}</p>
                                        <p className="text-[10px] text-gray-500">Half Day</p>
                                    </div>
                                    <div className="bg-rose-50 rounded-xl p-2">
                                        <p className="text-lg font-extrabold text-rose-500">{w.a}</p>
                                        <p className="text-[10px] text-gray-500">Absent</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-xs text-gray-500">{w.worked} days worked</span>
                                    <span className="text-sm font-extrabold text-emerald-700">{fmtCurr(w.earned)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Cell edit popover */}
            {editing && (
                <CellEditPopover
                    worker={editing.worker}
                    date={editing.date}
                    cell={editing.cell}
                    crops={crops}
                    farmId={farmId}
                    onSaved={() => {
                        const savedDate = editing?.date;
                        setEditing(null);
                        loadRecords();
                        if (savedDate === today() && typeof onReloadWorkers === 'function') {
                            onReloadWorkers();
                        }
                    }}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
};

// ─── FinanceLedgerSection ─────────────────────────────────────────────────────
const FinanceLedgerSection = ({ farmId }) => {
    const [txs, setTxs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!farmId) return;
        setLoading(true);
        getFinanceTransactions(farmId).then(({ data }) => {
            setTxs(data || []);
            setLoading(false);
        });
    }, [farmId]);

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-gray-800 text-base">📜 Financial Audit Trail & Transactions Log</h3>
            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading audit log…</div>
            ) : txs.length === 0 ? (
                <div className="text-center py-12 border rounded-2xl bg-gray-50 text-gray-400 text-sm">
                    No financial transactions recorded yet.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 text-xs border-b">
                            <tr>
                                <th className="p-3.5">Date</th>
                                <th className="p-3.5">Worker</th>
                                <th className="p-3.5">Transaction Type</th>
                                <th className="p-3.5 text-right">Amount (₹)</th>
                                <th className="p-3.5 text-right">Loan Deducted</th>
                                <th className="p-3.5 text-center">Mode</th>
                                <th className="p-3.5">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {txs.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="p-3.5 text-gray-600 text-xs">{fmtDate(t.payment_date || t.created_at)}</td>
                                    <td className="p-3.5 font-semibold text-gray-800">{t.worker_name}</td>
                                    <td className="p-3.5">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${TX_TYPE_BADGES[t.type] || 'bg-gray-100'}`}>
                                            {t.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-right font-bold text-gray-800">{fmtCurr(t.amount)}</td>
                                    <td className="p-3.5 text-right text-amber-600 font-medium">
                                        {t.loan_deducted > 0 ? fmtCurr(t.loan_deducted) : '—'}
                                    </td>
                                    <td className="p-3.5 text-center text-xs text-gray-500 font-medium">{t.payment_mode || 'CASH'}</td>
                                    <td className="p-3.5 text-xs text-gray-500">{t.notes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ─── WorkersPage (main export) ────────────────────────────────────────────────
export default function WorkersPage() {
    const { currentFarm } = useAuth();
    const farmId = currentFarm?.id;

    const [tab, setTab]           = useState('workers');     // 'workers' | 'monthly' | 'ledger' | 'inactive'
    const [workers, setWorkers]   = useState([]);
    const [inactive, setInactive] = useState([]);
    const [crops, setCrops]       = useState([]);  // active (growing) crops for attendance crop-tagging
    const [loading, setLoading]   = useState(true);

    const [workerModal, setWorkerModal]       = useState(null);  // null | { worker? }
    const [archiveModal, setArchiveModal]     = useState(null);  // null | worker
    const [payoutModalWorker, setPayoutModalWorker]   = useState(null);
    const [advanceModalWorker, setAdvanceModalWorker] = useState(null);
    const [bonusModalWorker, setBonusModalWorker]     = useState(null);
    const [settleModalWorker, setSettleModalWorker]   = useState(null);

    const loadWorkers = useCallback(async () => {
        if (!farmId) return;
        setLoading(true);
        const [{ data: active }, { data: arch }, { data: cropList }] = await Promise.all([
            getWorkersOverview(farmId),
            getInactiveWorkers(farmId),
            getActiveCrops(farmId),
        ]);
        setWorkers(active || []);
        setInactive(arch || []);
        setCrops((cropList || []));
        setLoading(false);
    }, [farmId]);

    useEffect(() => { loadWorkers(); }, [loadWorkers]);

    const handleMarkAttendance = async (workerId, status, activityType = 'GENERAL', cropId = null) => {
        const finalActivity = status === 'A' ? 'GENERAL' : (activityType || 'GENERAL');
        const finalCropId = status === 'A' ? null : (cropId || null);
        await upsertAttendance({
            worker_id: workerId, farm_id: farmId,
            date: today(), status,
            activity_type: finalActivity,
            crop_id: finalCropId,
        });
        // Optimistically update today_status, today_activity_type, today_crop_id
        setWorkers(prev => prev.map(w => w.id === workerId
            ? { ...w, today_status: status, today_activity_type: finalActivity, today_crop_id: finalCropId }
            : w
        ));
        loadWorkers();
    };

    const handleSaved = (data, isEdit) => {
        loadWorkers();
        setWorkerModal(null);
    };

    const handleArchived = (id) => {
        const w = workers.find(x => x.id === id);
        setWorkers(prev => prev.filter(x => x.id !== id));
        if (w) setInactive(prev => [{ ...w, is_active: false, inactive_since: today() }, ...prev]);
        setArchiveModal(null);
    };

    const handleActivate = async (id) => {
        const { data, error } = await setWorkerStatus(id, { farm_id: farmId, is_active: true });
        if (!error && data) {
            setInactive(prev => prev.filter(x => x.id !== id));
            loadWorkers();
        }
    };

    // Summary Totals
    const totalLoans = workers.reduce((sum, w) => sum + parseFloat(w.loan_balance || 0), 0);
    const totalCarryforward = workers.reduce((sum, w) => sum + parseFloat(w.unpaid_carryforward_salary || 0), 0);

    const tabs = [
        { id: 'workers',  label: `👷 Active Workers (${workers.length})` },
        { id: 'monthly',  label: '📅 Attendance Calendar' },
        { id: 'ledger',   label: '📜 Financial History Log' },
        { id: 'inactive', label: `📦 Inactive Roster (${inactive.length})` },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Workers Hub</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{currentFarm?.name || 'Your farm'} workforce management, attendance & salary payouts</p>
                </div>
                {tab === 'workers' && (
                    <button onClick={() => setWorkerModal({ worker: null })}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-sm flex items-center gap-1.5">
                        + Add Worker
                    </button>
                )}
            </div>

            {/* Quick KPI Overview Bar */}
            {tab === 'workers' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-white border rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500 font-medium">Active Workers</p>
                        <p className="text-2xl font-extrabold text-gray-800 mt-1">{workers.length}</p>
                    </div>
                    <div className="bg-white border rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500 font-medium">Total Unpaid Carryforward Salary</p>
                        <p className="text-2xl font-extrabold text-emerald-600 mt-1">{fmtCurr(totalCarryforward)}</p>
                    </div>
                    <div className="bg-white border rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-500 font-medium">Total Outstanding Advances / Loans</p>
                        <p className="text-2xl font-extrabold text-amber-600 mt-1">{fmtCurr(totalLoans)}</p>
                    </div>
                </div>
            )}

            {/* Tabs Bar */}
            <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 overflow-x-auto">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex-1 min-w-max px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                            tab === t.id ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
                        }`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Main Content View */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                {loading ? (
                    <div className="text-center py-16 text-gray-400">Loading workforce hub…</div>
                ) : (
                    <>
                        {/* Tab 1: Active Workers (All-in-One Dashboard Hub) */}
                        {tab === 'workers' && (
                            workers.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-5xl mb-3">👷</p>
                                    <p className="text-gray-500 font-semibold">No active workers yet</p>
                                    <p className="text-gray-400 text-sm mt-1">Click <strong>+ Add Worker</strong> to build your team</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-5">
                                    {workers.map(w => (
                                        <AllInOneWorkerCard key={w.id} worker={w} farmId={farmId} crops={crops}
                                            onMarkAttendance={handleMarkAttendance}
                                            onEdit={(w) => setWorkerModal({ worker: w })}
                                            onArchive={(w) => setArchiveModal(w)}
                                            onPaySalary={(w) => setPayoutModalWorker(w)}
                                            onAdvance={(w) => setAdvanceModalWorker(w)}
                                            onBonus={(w) => setBonusModalWorker(w)}
                                            onSettleLoan={(w) => setSettleModalWorker(w)} />
                                    ))}
                                </div>
                            )
                        )}

                        {/* Tab 2: Attendance Calendar */}
                        {tab === 'monthly' && (
                            <MonthlyAttendance workers={workers} farmId={farmId} crops={crops} onReloadWorkers={loadWorkers} />
                        )}

                        {/* Tab 3: Financial History Ledger */}
                        {tab === 'ledger' && (
                            <FinanceLedgerSection farmId={farmId} />
                        )}

                        {/* Tab 4: Inactive Workers */}
                        {tab === 'inactive' && (
                            inactive.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-5xl mb-3">📦</p>
                                    <p className="text-gray-500 font-semibold">No archived workers</p>
                                    <p className="text-gray-400 text-sm mt-1">Archived workers will appear here</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {inactive.map(w => (
                                        <div key={w.id} className="rounded-2xl border p-5 bg-gray-50 opacity-80 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-gray-800">{w.name}</p>
                                                <p className="text-xs text-gray-500">{w.role || '—'} {w.inactive_since ? `• Archived ${fmtDate(w.inactive_since)}` : ''}</p>
                                                {w.inactive_notes && <p className="text-xs text-amber-600 mt-1">{w.inactive_notes}</p>}
                                            </div>
                                            <button onClick={() => handleActivate(w.id)}
                                                className="text-xs border border-green-300 hover:border-green-500 text-green-600 px-3 py-1.5 rounded-lg transition-colors font-semibold bg-white">
                                                ✓ Re-activate
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {workerModal !== null && (
                <WorkerModal
                    worker={workerModal.worker}
                    farmId={farmId}
                    onClose={() => setWorkerModal(null)}
                    onSaved={handleSaved} />
            )}
            {archiveModal && (
                <ArchiveModal
                    worker={archiveModal}
                    farmId={farmId}
                    onClose={() => setArchiveModal(null)}
                    onArchived={handleArchived} />
            )}
            {payoutModalWorker && (
                <PayoutModal
                    worker={payoutModalWorker}
                    farmId={farmId}
                    onClose={() => setPayoutModalWorker(null)}
                    onPaid={() => {
                        setPayoutModalWorker(null);
                        loadWorkers();
                    }} />
            )}
            {advanceModalWorker && (
                <AdvanceModal
                    worker={advanceModalWorker}
                    farmId={farmId}
                    onClose={() => setAdvanceModalWorker(null)}
                    onRecorded={() => {
                        setAdvanceModalWorker(null);
                        loadWorkers();
                    }} />
            )}
            {bonusModalWorker && (
                <BonusModal
                    worker={bonusModalWorker}
                    farmId={farmId}
                    onClose={() => setBonusModalWorker(null)}
                    onRecorded={() => {
                        setBonusModalWorker(null);
                        loadWorkers();
                    }} />
            )}
            {settleModalWorker && (
                <LoanSettlementModal
                    worker={settleModalWorker}
                    farmId={farmId}
                    onClose={() => setSettleModalWorker(null)}
                    onRecorded={() => {
                        setSettleModalWorker(null);
                        loadWorkers();
                    }} />
            )}
        </div>
    );
}
