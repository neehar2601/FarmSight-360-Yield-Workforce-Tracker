import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getWorkers, getInactiveWorkers, createWorker,
    updateWorker, setWorkerStatus, getAttendance, upsertAttendance,
} from '../../utils/workerApi';

// ─── helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

const STATUS_STYLES = {
    P: 'bg-green-100 text-green-800',
    H: 'bg-yellow-100 text-yellow-800',
    A: 'bg-red-100 text-red-800',
};
const STATUS_LABEL = { P: 'Present', H: 'Half Day', A: 'Absent' };

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
        const body = { ...form, farm_id: farmId,
            per_day_salary: parseFloat(form.per_day_salary) || 0 };
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
    const [records, setRecords] = useState([]); // flat array from API
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!farmId || workers.length === 0) return;
        setLoading(true);
        getAttendance(farmId, displayMonth).then(({ data }) => {
            setRecords(data || []);
            setLoading(false);
        });
    }, [farmId, displayMonth, workers.length]);

    // Build lookup: { workerId: { 'YYYY-MM-DD': 'P'|'H'|'A' } }
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
        // Optimistic update
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

// ─── WorkersPage (main export) ────────────────────────────────────────────────
export default function WorkersPage() {
    const { currentFarm } = useAuth();
    const farmId = currentFarm?.id;

    const [tab, setTab]           = useState('workers');     // 'workers' | 'inactive' | 'today' | 'monthly'
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
        { id: 'monthly',  label: '📅 Monthly View' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Workers</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{currentFarm?.name || 'Your farm'} workforce roster & attendance</p>
                </div>
                {tab === 'workers' && (
                    <button onClick={() => setWorkerModal({ worker: null })}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
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
