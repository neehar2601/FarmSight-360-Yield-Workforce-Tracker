import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getWorkers, getInactiveWorkers, createWorker,
    updateWorker, setWorkerStatus, getAttendance, upsertAttendance,
    getPayrollSummary, recordAdvance, recordLoanSettlement, accrueSalary, processPayout, getFinanceTransactions,
} from '../../utils/workerApi';

// ─── helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurr = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const STATUS_STYLES = {
    P: 'bg-green-100 text-green-800',
    H: 'bg-yellow-100 text-yellow-800',
    A: 'bg-red-100 text-red-800',
};
const STATUS_LABEL = { P: 'Present', H: 'Half Day', A: 'Absent' };

const TX_TYPE_BADGES = {
    ADVANCE: 'bg-amber-100 text-amber-800 border-amber-200',
    LOAN_SETTLEMENT: 'bg-blue-100 text-blue-800 border-blue-200',
    SALARY_ACCRUAL: 'bg-purple-100 text-purple-800 border-purple-200',
    PAYOUT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

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
                    <strong>{worker.name}</strong> will be moved to the Inactive list and hidden from attendance. You can re-activate them anytime.
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

// ─── WorkerCard ───────────────────────────────────────────────────────────────
const WorkerCard = ({ worker, isActive, onEdit, onArchive, onActivate }) => (
    <div className={`rounded-2xl border p-5 transition-all ${isActive ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-80'}`}>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {worker.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-bold text-gray-800">{worker.name}</p>
                    <p className="text-sm text-gray-500">{worker.role || 'No role set'}</p>
                </div>
            </div>
            <div className="flex gap-2">
                {isActive ? (
                    <>
                        <button onClick={() => onEdit(worker)} className="text-xs border border-gray-300 hover:border-gray-400 text-gray-600 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                        <button onClick={() => onArchive(worker)} className="text-xs border border-amber-300 hover:border-amber-500 text-amber-600 px-3 py-1.5 rounded-lg transition-colors">Archive</button>
                    </>
                ) : (
                    <button onClick={() => onActivate(worker.id)}
                        className="text-xs border border-green-300 hover:border-green-500 text-green-600 px-3 py-1.5 rounded-lg transition-colors">
                        ✓ Re-activate
                    </button>
                )}
            </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
            {worker.contact && <span>📞 {worker.contact}</span>}
            {worker.per_day_salary > 0 && <span>💰 ₹{Number(worker.per_day_salary).toLocaleString('en-IN')}/day</span>}
            <span>💳 Loan: <strong className={worker.loan_balance > 0 ? 'text-amber-600' : 'text-gray-600'}>{fmtCurr(worker.loan_balance)}</strong></span>
            <span>🏦 Deposit: <strong className={worker.deposit_balance > 0 ? 'text-emerald-600' : 'text-gray-600'}>{fmtCurr(worker.deposit_balance)}</strong></span>
            {worker.skills && <span className="col-span-2">🛠 {worker.skills}</span>}
            {!isActive && worker.inactive_since && (
                <span className="col-span-2 text-amber-600">📦 Archived {fmtDate(worker.inactive_since)}{worker.inactive_notes ? ` — ${worker.inactive_notes}` : ''}</span>
            )}
        </div>
    </div>
);

// ─── TodayAttendance ──────────────────────────────────────────────────────────
const TodayAttendance = ({ workers, farmId }) => {
    const [attendance, setAttendance] = useState({}); // { workerId: 'P'|'H'|'A' }
    const [savingId, setSavingId] = useState(null);
    const todayStr = today();

    useEffect(() => {
        if (!farmId || workers.length === 0) return;
        getAttendance(farmId).then(({ data }) => {
            if (!data) return;
            const map = {};
            data.forEach(r => { map[r.worker_id] = r.status; });
            setAttendance(map);
        });
    }, [farmId, workers.length]);

    const mark = async (workerId, status) => {
        setSavingId(workerId);
        setAttendance(prev => ({ ...prev, [workerId]: status }));
        await upsertAttendance({ worker_id: workerId, farm_id: farmId, date: todayStr, status });
        setSavingId(null);
    };

    if (workers.length === 0) {
        return <p className="text-gray-400 text-sm text-center py-12">No active workers to mark attendance for.</p>;
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {workers.map(w => (
                <div key={w.id} className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">{w.name.charAt(0)}</div>
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">{w.name}</p>
                            <p className="text-xs text-gray-400">{w.role || '—'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        {savingId === w.id && <span className="text-xs text-gray-400 mr-1">Saving…</span>}
                        {['P', 'H', 'A'].map(s => (
                            <button key={s} onClick={() => mark(w.id, s)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                                    attendance[w.id] === s
                                        ? s === 'P' ? 'bg-green-500 border-green-500 text-white'
                                            : s === 'H' ? 'bg-yellow-400 border-yellow-400 text-white'
                                            : 'bg-red-500 border-red-500 text-white'
                                        : 'border-gray-200 text-gray-500 hover:border-gray-400'
                                }`}>
                                {STATUS_LABEL[s]}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─── MonthlyAttendance ────────────────────────────────────────────────────────
const MonthlyAttendance = ({ workers, farmId }) => {
    const now = new Date();
    const [displayMonth, setDisplayMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!farmId || workers.length === 0) return;
        setLoading(true);
        getAttendance(farmId, displayMonth).then(({ data }) => {
            setRecords(data || []);
            setLoading(false);
        });
    }, [farmId, displayMonth, workers.length]);

    const lookup = {};
    records.forEach(r => {
        if (!lookup[r.worker_id]) lookup[r.worker_id] = {};
        lookup[r.worker_id][r.date.split('T')[0]] = r.status;
    });

    const [year, month] = displayMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const todayStr = today();

    const prevMonth = () => {
        const d = new Date(year, month - 2, 1);
        setDisplayMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };
    const nextMonth = () => {
        const d = new Date(year, month, 1);
        setDisplayMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const upsert = async (workerId, day, status) => {
        const dateStr = `${displayMonth}-${String(day).padStart(2, '0')}`;
        setRecords(prev => {
            const existing = prev.find(r => r.worker_id === workerId && r.date.startsWith(dateStr));
            if (existing) return prev.map(r => r.worker_id === workerId && r.date.startsWith(dateStr) ? { ...r, status } : r);
            return [...prev, { worker_id: workerId, farm_id: farmId, date: dateStr, status }];
        });
        await upsertAttendance({ worker_id: workerId, farm_id: farmId, date: dateStr, status });
    };

    if (workers.length === 0) return <p className="text-gray-400 text-sm text-center py-12">No active workers.</p>;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors">← Prev</button>
                <h3 className="font-bold text-gray-800">
                    {new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={nextMonth} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors">Next →</button>
            </div>
            {loading ? (
                <p className="text-center text-gray-400 py-10">Loading…</p>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-center text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-2 border border-gray-200 text-left text-sm sticky left-0 bg-gray-50 z-10 min-w-[140px]">Worker</th>
                                {days.map(d => {
                                    const dt = new Date(year, month - 1, d);
                                    const isSun = dt.getDay() === 0;
                                    return (
                                        <th key={d} className={`p-2 border border-gray-200 min-w-[32px] ${isSun ? 'bg-red-50 text-red-400' : ''}`}>
                                            <div className="font-bold">{d}</div>
                                            <div className="text-gray-400 font-normal">{dt.toLocaleDateString('en-IN', { weekday: 'narrow' })}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {workers.map(w => (
                                <tr key={w.id} className="hover:bg-gray-50">
                                    <td className="p-2 border border-gray-200 text-left sticky left-0 bg-white z-10 font-medium">{w.name}</td>
                                    {days.map(d => {
                                        const dateStr = `${displayMonth}-${String(d).padStart(2, '0')}`;
                                        const isFuture = dateStr > todayStr;
                                        const status = lookup[w.id]?.[dateStr];
                                        return (
                                            <td key={d} className="border border-gray-100 p-0">
                                                {isFuture ? (
                                                    <div className="h-8 bg-gray-50" />
                                                ) : (
                                                    <select value={status || ''}
                                                        onChange={(e) => e.target.value && upsert(w.id, d, e.target.value)}
                                                        className={`w-full h-8 text-center border-0 focus:ring-1 focus:ring-green-400 text-xs font-semibold cursor-pointer
                                                            ${status === 'P' ? 'bg-green-100 text-green-700'
                                                              : status === 'H' ? 'bg-yellow-100 text-yellow-700'
                                                              : status === 'A' ? 'bg-red-100 text-red-700'
                                                              : 'bg-white text-gray-300'}`}>
                                                        <option value="">—</option>
                                                        <option value="P">P</option>
                                                        <option value="H">H</option>
                                                        <option value="A">A</option>
                                                    </select>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="flex gap-4 mt-4 text-xs text-gray-500">
                <span><span className="inline-block w-3 h-3 rounded bg-green-200 mr-1"></span>P = Present</span>
                <span><span className="inline-block w-3 h-3 rounded bg-yellow-200 mr-1"></span>H = Half Day</span>
                <span><span className="inline-block w-3 h-3 rounded bg-red-200 mr-1"></span>A = Absent</span>
            </div>
        </div>
    );
};

// ─── PayoutModal ──────────────────────────────────────────────────────────────
const PayoutModal = ({ workerSummary, farmId, period, onClose, onPaid }) => {
    const [payoutAmount, setPayoutAmount] = useState(
        Math.max(0, workerSummary.gross_salary + workerSummary.deposit_balance - workerSummary.paid_in_period)
    );
    const [loanDeduct, setLoanDeduct] = useState(
        Math.min(workerSummary.loan_balance, Math.max(0, workerSummary.gross_salary + workerSummary.deposit_balance))
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
            worker_id: workerSummary.worker_id,
            farm_id: farmId,
            amount: amt,
            loan_deducted: deduct,
            from_date: period.from_date,
            to_date: period.to_date,
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
                        <h2 className="text-xl font-bold text-gray-800">💰 Salary Payout</h2>
                        <p className="text-xs text-gray-500">{workerSummary.name} ({period.from_date} to {period.to_date})</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{err}</p>}

                    {/* Breakdown Box */}
                    <div className="bg-gray-50 rounded-xl p-4 text-xs space-y-1.5 border">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Period Worked Days:</span>
                            <span className="font-semibold text-gray-800">{workerSummary.worked_days} days ({workerSummary.p_days}P / {workerSummary.h_days}H)</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Gross Salary (Period):</span>
                            <span className="font-semibold text-gray-800">{fmtCurr(workerSummary.gross_salary)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Accrued Deposit Balance:</span>
                            <span className="font-semibold text-emerald-600">{fmtCurr(workerSummary.deposit_balance)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t">
                            <span className="text-gray-500">Outstanding Loan Balance:</span>
                            <span className="font-bold text-amber-600">{fmtCurr(workerSummary.loan_balance)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Total Payout Amount (₹)</label>
                            <input type="number" min="0" step="0.01" value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Deduct from Loan (₹)</label>
                            <input type="number" min="0" max={workerSummary.loan_balance} step="0.01"
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
                            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm font-bold text-emerald-700">
                                {fmtCurr(netPayable)}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                            <input value={notes} onChange={(e) => setNotes(e.target.value)}
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                placeholder="e.g. Weekly settlement including bonus" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                            {loading ? 'Processing…' : 'Confirm & Record Payout'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── AdvanceModal ─────────────────────────────────────────────────────────────
const AdvanceModal = ({ workers, farmId, onClose, onRecorded }) => {
    const [workerId, setWorkerId] = useState(workers[0]?.id || '');
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(today());
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!workerId || !amount || parseFloat(amount) <= 0) {
            setErr('Please select a worker and enter a valid amount');
            return;
        }
        setLoading(true); setErr('');
        const { data, error } = await recordAdvance({
            worker_id: workerId, farm_id: farmId, amount: parseFloat(amount),
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
                    <h2 className="text-xl font-bold text-gray-800">💵 Issue Cash Advance</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{err}</p>}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Worker *</label>
                        <select value={workerId} onChange={(e) => setWorkerId(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white">
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.name} (Current Loan: {fmtCurr(w.loan_balance)})</option>
                            ))}
                        </select>
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
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder="e.g. Medical emergency advance" />
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
const LoanSettlementModal = ({ workers, farmId, onClose, onRecorded }) => {
    const [workerId, setWorkerId] = useState(workers[0]?.id || '');
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(today());
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const selectedWorker = workers.find(w => w.id === workerId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!workerId || !amount || parseFloat(amount) <= 0) {
            setErr('Please select a worker and enter a valid settlement amount');
            return;
        }
        setLoading(true); setErr('');
        const { data, error } = await recordLoanSettlement({
            worker_id: workerId, farm_id: farmId, amount: parseFloat(amount),
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
                    <h2 className="text-xl font-bold text-gray-800">🤝 Loan Settlement</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{err}</p>}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Worker *</label>
                        <select value={workerId} onChange={(e) => setWorkerId(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white">
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.name} (Owes: {fmtCurr(w.loan_balance)})</option>
                            ))}
                        </select>
                    </div>
                    {selectedWorker && (
                        <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl">
                            Current Loan Balance: <strong>{fmtCurr(selectedWorker.loan_balance)}</strong>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Settlement Repayment Amount (₹) *</label>
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

// ─── AccrueDepositModal ───────────────────────────────────────────────────────
const AccrueDepositModal = ({ workerSummary, farmId, period, onClose, onAccrued }) => {
    const [grossSalary, setGrossSalary] = useState(workerSummary.gross_salary);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(grossSalary);
        if (!amt || amt <= 0) { setErr('Enter a valid gross salary amount'); return; }

        setLoading(true); setErr('');
        const { data, error } = await accrueSalary({
            worker_id: workerSummary.worker_id,
            farm_id: farmId,
            gross_salary: amt,
            worked_days: workerSummary.worked_days,
            from_date: period.from_date,
            to_date: period.to_date,
            notes
        });

        setLoading(false);
        if (error) { setErr(error); return; }
        onAccrued(data);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">📥 Accrue Salary to Deposit</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{err}</p>}
                    <p className="text-xs text-gray-500">
                        Hold earned period salary for <strong>{workerSummary.name}</strong> as a deposit to be paid out later (e.g. month-end or custom date).
                    </p>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Gross Salary Amount to Deposit (₹) *</label>
                        <input type="number" min="1" step="0.01" value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                        <input value={notes} onChange={(e) => setNotes(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="e.g. Worker requested bulk payout later" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                            {loading ? 'Depositing…' : 'Accrue to Deposit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── PayrollSection ───────────────────────────────────────────────────────────
const PayrollSection = ({ workers, farmId, onRefreshWorkers }) => {
    // Preset period logic
    const getThisWeek = () => {
        const t = new Date();
        const d = t.getDay();
        const diffMon = (d === 0 ? -6 : 1) - d;
        const m = new Date(t); m.setDate(t.getDate() + diffMon);
        const s = new Date(m); s.setDate(m.getDate() + 6);
        return { from: m.toISOString().split('T')[0], to: s.toISOString().split('T')[0] };
    };

    const getThisMonth = () => {
        const t = new Date();
        const m = new Date(t.getFullYear(), t.getMonth(), 1);
        const s = new Date(t.getFullYear(), t.getMonth() + 1, 0);
        return { from: m.toISOString().split('T')[0], to: s.toISOString().split('T')[0] };
    };

    const [preset, setPreset] = useState('THIS_WEEK'); // 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'
    const [period, setPeriod] = useState(getThisWeek());
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(false);

    const [payoutModalWorker, setPayoutModalWorker] = useState(null);
    const [accrueModalWorker, setAccrueModalWorker] = useState(null);

    const loadPayroll = useCallback(async () => {
        if (!farmId) return;
        setLoading(true);
        const { data } = await getPayrollSummary(farmId, period.from, period.to);
        if (data) {
            setSummary(data.summary || []);
        }
        setLoading(false);
    }, [farmId, period.from, period.to]);

    useEffect(() => { loadPayroll(); }, [loadPayroll]);

    const handlePresetChange = (p) => {
        setPreset(p);
        if (p === 'THIS_WEEK') setPeriod(getThisWeek());
        else if (p === 'THIS_MONTH') setPeriod(getThisMonth());
    };

    const totals = summary.reduce((acc, s) => ({
        worked_days: acc.worked_days + s.worked_days,
        gross_salary: acc.gross_salary + s.gross_salary,
        deposit_balance: acc.deposit_balance + s.deposit_balance,
        loan_balance: acc.loan_balance + s.loan_balance,
        paid_in_period: acc.paid_in_period + s.paid_in_period,
    }), { worked_days: 0, gross_salary: 0, deposit_balance: 0, loan_balance: 0, paid_in_period: 0 });

    return (
        <div className="space-y-6">
            {/* Top Period Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 border p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                    <button onClick={() => handlePresetChange('THIS_WEEK')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${preset === 'THIS_WEEK' ? 'bg-green-600 text-white shadow' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}>
                        📅 This Week
                    </button>
                    <button onClick={() => handlePresetChange('THIS_MONTH')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${preset === 'THIS_MONTH' ? 'bg-green-600 text-white shadow' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}>
                        🗓 This Month
                    </button>
                    <button onClick={() => setPreset('CUSTOM')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${preset === 'CUSTOM' ? 'bg-green-600 text-white shadow' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}>
                        ⚙️ Custom Period
                    </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 font-semibold">From:</span>
                    <input type="date" value={period.from} onChange={(e) => { setPreset('CUSTOM'); setPeriod(p => ({ ...p, from: e.target.value })); }}
                        className="border rounded-xl px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    <span className="text-gray-500 font-semibold">To:</span>
                    <input type="date" value={period.to} onChange={(e) => { setPreset('CUSTOM'); setPeriod(p => ({ ...p, to: e.target.value })); }}
                        className="border rounded-xl px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium">Total Days Worked</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{totals.worked_days} <span className="text-xs font-normal text-gray-400">days</span></p>
                </div>
                <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium">Gross Salary (Period)</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{fmtCurr(totals.gross_salary)}</p>
                </div>
                <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium">Paid Out in Period</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{fmtCurr(totals.paid_in_period)}</p>
                </div>
                <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium">Total Worker Deposits</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{fmtCurr(totals.deposit_balance)}</p>
                </div>
            </div>

            {/* Worker Payroll Table */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Calculating payroll summary…</div>
            ) : summary.length === 0 ? (
                <p className="text-center py-12 text-gray-400 text-sm">No active workers found for payroll calculation.</p>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 text-xs border-b">
                            <tr>
                                <th className="p-3.5">Worker</th>
                                <th className="p-3.5 text-center">Daily Wage</th>
                                <th className="p-3.5 text-center">Attendance (P/H/A)</th>
                                <th className="p-3.5 text-center">Days Worked</th>
                                <th className="p-3.5 text-right">Gross Earned</th>
                                <th className="p-3.5 text-right">Deposit Balance</th>
                                <th className="p-3.5 text-right">Loan Owed</th>
                                <th className="p-3.5 text-center">Paid in Period</th>
                                <th className="p-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {summary.map(s => {
                                const netAvailable = s.gross_salary + s.deposit_balance;
                                return (
                                    <tr key={s.worker_id} className="hover:bg-gray-50">
                                        <td className="p-3.5">
                                            <p className="font-semibold text-gray-800">{s.name}</p>
                                            <p className="text-xs text-gray-400">{s.role || 'Worker'}</p>
                                        </td>
                                        <td className="p-3.5 text-center text-gray-600 font-medium">{fmtCurr(s.per_day_salary)}</td>
                                        <td className="p-3.5 text-center text-xs">
                                            <span className="text-green-700 font-bold">{s.p_days}P</span> / <span className="text-amber-600 font-bold">{s.h_days}H</span> / <span className="text-red-500">{s.a_days}A</span>
                                        </td>
                                        <td className="p-3.5 text-center font-bold text-gray-800">{s.worked_days}</td>
                                        <td className="p-3.5 text-right font-bold text-gray-800">{fmtCurr(s.gross_salary)}</td>
                                        <td className="p-3.5 text-right text-purple-700 font-semibold">{fmtCurr(s.deposit_balance)}</td>
                                        <td className="p-3.5 text-right text-amber-600 font-semibold">{fmtCurr(s.loan_balance)}</td>
                                        <td className="p-3.5 text-center">
                                            {s.paid_in_period > 0 ? (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                                    ✓ {fmtCurr(s.paid_in_period)}
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                                                    Unpaid
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5 text-right space-x-2">
                                            <button onClick={() => setPayoutModalWorker(s)}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm">
                                                💰 Pay Salary
                                            </button>
                                            <button onClick={() => setAccrueModalWorker(s)}
                                                className="px-3 py-1.5 border border-purple-300 hover:bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold transition-colors">
                                                📥 Deposit
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            {payoutModalWorker && (
                <PayoutModal
                    workerSummary={payoutModalWorker}
                    farmId={farmId}
                    period={{ from_date: period.from, to_date: period.to }}
                    onClose={() => setPayoutModalWorker(null)}
                    onPaid={() => {
                        setPayoutModalWorker(null);
                        loadPayroll();
                        onRefreshWorkers();
                    }} />
            )}
            {accrueModalWorker && (
                <AccrueDepositModal
                    workerSummary={accrueModalWorker}
                    farmId={farmId}
                    period={{ from_date: period.from, to_date: period.to }}
                    onClose={() => setAccrueModalWorker(null)}
                    onAccrued={() => {
                        setAccrueModalWorker(null);
                        loadPayroll();
                        onRefreshWorkers();
                    }} />
            )}
        </div>
    );
};

// ─── FinanceAndLoansSection ───────────────────────────────────────────────────
const FinanceAndLoansSection = ({ workers, farmId, onRefreshWorkers }) => {
    const [txs, setTxs] = useState([]);
    const [loading, setLoading] = useState(false);

    const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
    const [settlementModalOpen, setSettlementModalOpen] = useState(false);

    const loadTransactions = useCallback(async () => {
        if (!farmId) return;
        setLoading(true);
        const { data } = await getFinanceTransactions(farmId);
        setTxs(data || []);
        setLoading(false);
    }, [farmId]);

    useEffect(() => { loadTransactions(); }, [loadTransactions]);

    const totalLoans = workers.reduce((sum, w) => sum + parseFloat(w.loan_balance || 0), 0);
    const totalDeposits = workers.reduce((sum, w) => sum + parseFloat(w.deposit_balance || 0), 0);

    return (
        <div className="space-y-6">
            {/* Action Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-3">
                    <button onClick={() => setAdvanceModalOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
                        + Issue Advance
                    </button>
                    <button onClick={() => setSettlementModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
                        🤝 Settle Loan
                    </button>
                </div>

                <div className="flex gap-4 text-xs font-semibold">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl">
                        Total Active Worker Loans: <span className="text-sm font-bold ml-1">{fmtCurr(totalLoans)}</span>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-2 rounded-xl">
                        Total Worker Salary Deposits: <span className="text-sm font-bold ml-1">{fmtCurr(totalDeposits)}</span>
                    </div>
                </div>
            </div>

            {/* Audit Log Table */}
            <div>
                <h3 className="font-bold text-gray-800 text-base mb-3">📜 Financial Transactions History</h3>
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

            {/* Modals */}
            {advanceModalOpen && (
                <AdvanceModal
                    workers={workers}
                    farmId={farmId}
                    onClose={() => setAdvanceModalOpen(false)}
                    onRecorded={() => {
                        setAdvanceModalOpen(false);
                        loadTransactions();
                        onRefreshWorkers();
                    }} />
            )}
            {settlementModalOpen && (
                <LoanSettlementModal
                    workers={workers}
                    farmId={farmId}
                    onClose={() => setSettlementModalOpen(false)}
                    onRecorded={() => {
                        setSettlementModalOpen(false);
                        loadTransactions();
                        onRefreshWorkers();
                    }} />
            )}
        </div>
    );
};

// ─── WorkersPage (main export) ────────────────────────────────────────────────
export default function WorkersPage() {
    const { currentFarm } = useAuth();
    const farmId = currentFarm?.id;

    const [tab, setTab]           = useState('workers');     // 'workers' | 'inactive' | 'today' | 'monthly' | 'payroll' | 'finance'
    const [workers, setWorkers]   = useState([]);
    const [inactive, setInactive] = useState([]);
    const [loading, setLoading]   = useState(true);

    const [workerModal, setWorkerModal]   = useState(null);  // null | { worker? }
    const [archiveModal, setArchiveModal] = useState(null);  // null | worker

    const loadWorkers = useCallback(async () => {
        if (!farmId) return;
        setLoading(true);
        const [{ data: active }, { data: arch }] = await Promise.all([
            getWorkers(farmId),
            getInactiveWorkers(farmId),
        ]);
        setWorkers(active || []);
        setInactive(arch || []);
        setLoading(false);
    }, [farmId]);

    useEffect(() => { loadWorkers(); }, [loadWorkers]);

    const handleSaved = (data, isEdit) => {
        if (isEdit) {
            setWorkers(prev => prev.map(w => w.id === data.id ? data : w));
        } else {
            setWorkers(prev => [data, ...prev]);
        }
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
            setWorkers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        }
    };

    const tabs = [
        { id: 'workers',  label: `👷 Active (${workers.length})` },
        { id: 'inactive', label: `📦 Inactive (${inactive.length})` },
        { id: 'today',    label: '📋 Today\'s Attendance' },
        { id: 'monthly',  label: '📅 Monthly Matrix' },
        { id: 'payroll',  label: '💰 Salary & Payroll' },
        { id: 'finance',  label: '💵 Advances & Loans' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Workers</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{currentFarm?.name || 'Your farm'} workforce roster, attendance & financial payroll</p>
                </div>
                {tab === 'workers' && (
                    <button onClick={() => setWorkerModal({ worker: null })}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
                        + Add Worker
                    </button>
                )}
            </div>

            {/* Tabs */}
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

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                {loading ? (
                    <div className="text-center py-16 text-gray-400">Loading…</div>
                ) : (
                    <>
                        {tab === 'workers' && (
                            workers.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-5xl mb-3">👷</p>
                                    <p className="text-gray-500 font-semibold">No active workers yet</p>
                                    <p className="text-gray-400 text-sm mt-1">Click <strong>+ Add Worker</strong> to get started</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {workers.map(w => (
                                        <WorkerCard key={w.id} worker={w} isActive={true}
                                            onEdit={(w) => setWorkerModal({ worker: w })}
                                            onArchive={(w) => setArchiveModal(w)}
                                            onActivate={handleActivate} />
                                    ))}
                                </div>
                            )
                        )}

                        {tab === 'inactive' && (
                            inactive.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="text-5xl mb-3">📦</p>
                                    <p className="text-gray-500 font-semibold">No inactive workers</p>
                                    <p className="text-gray-400 text-sm mt-1">Archived workers will appear here</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {inactive.map(w => (
                                        <WorkerCard key={w.id} worker={w} isActive={false}
                                            onEdit={() => {}}
                                            onArchive={() => {}}
                                            onActivate={handleActivate} />
                                    ))}
                                </div>
                            )
                        )}

                        {tab === 'today' && (
                            <TodayAttendance workers={workers} farmId={farmId} />
                        )}

                        {tab === 'monthly' && (
                            <MonthlyAttendance workers={workers} farmId={farmId} />
                        )}

                        {tab === 'payroll' && (
                            <PayrollSection workers={workers} farmId={farmId} onRefreshWorkers={loadWorkers} />
                        )}

                        {tab === 'finance' && (
                            <FinanceAndLoansSection workers={workers} farmId={farmId} onRefreshWorkers={loadWorkers} />
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
        </div>
    );
}
