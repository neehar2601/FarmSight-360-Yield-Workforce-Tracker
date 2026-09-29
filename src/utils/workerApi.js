/**
 * workerApi.js — Prototype Mock Implementation
 * Directly connects to mockStore with zero backend dependency.
 */

import { mockStore } from '../mock/mockStore';

export const getWorkers = async (farmId) => ({
    data: mockStore.getWorkers(farmId),
    error: null,
});

export const getInactiveWorkers = async () => ({
    data: [],
    error: null,
});

export const createWorker = async (body) => ({
    data: mockStore.createWorker(body).data,
    error: null,
});

export const updateWorker = async (id, body) => {
    const worker = mockStore.state.workers.find(w => w.id === id);
    if (worker) Object.assign(worker, body);
    mockStore.saveState();
    return { data: worker, error: null };
};

export const setWorkerStatus = async (id, body) => {
    const worker = mockStore.state.workers.find(w => w.id === id);
    if (worker) worker.is_active = body.is_active;
    mockStore.saveState();
    return { data: worker, error: null };
};

export const getAttendance = async () => ({
    data: mockStore.state.worker_attendance || {},
    error: null,
});

export const upsertAttendance = async (body) => {
    if (!mockStore.state.worker_attendance[body.worker_id]) {
        mockStore.state.worker_attendance[body.worker_id] = {};
    }
    mockStore.state.worker_attendance[body.worker_id][body.date] = body.status;
    mockStore.saveState();
    return { data: { success: true }, error: null };
};

export const getWorkerTransactions = async () => ({
    data: mockStore.state.worker_transactions || [],
    error: null,
});

export const createWorkerTransaction = async (body) => {
    const tx = {
        id: `wtx-${Date.now()}`,
        ...body,
        created_at: new Date().toISOString(),
    };
    mockStore.state.worker_transactions.unshift(tx);
    mockStore.saveState();
    return { data: tx, error: null };
};

export const getWorkerFinanceSummary = async () => ({
    data: {
        totalPaid: 18500,
        pendingWages: 3200,
        workerCount: mockStore.state.workers.length,
    },
    error: null,
});

// ── Finance & Payroll Helpers ─────────────────────────────────────────────────
export const getWorkersOverview = async () => ({
    data: (mockStore.state.workers || []).map(w => ({
        ...w,
        today_status: 'P',
        salary_balance: 1200,
        loan_balance: 0,
    })),
    error: null,
});

export const getPayrollSummary = async () => ({
    data: {
        total_payout: 12500,
        total_bonus: 1000,
        total_advance: 2000,
    },
    error: null,
});

export const recordAdvance = async (body) => createWorkerTransaction({ ...body, type: 'advance' });
export const recordBonus = async (body) => createWorkerTransaction({ ...body, type: 'bonus' });
export const recordLoanSettlement = async (body) => createWorkerTransaction({ ...body, type: 'loan_settlement' });
export const accrueSalary = async (body) => createWorkerTransaction({ ...body, type: 'salary_accrual' });
export const processPayout = async (body) => createWorkerTransaction({ ...body, type: 'payout' });

export const getFinanceTransactions = async () => ({
    data: mockStore.state.worker_transactions || [],
    error: null,
});

export const getActivityBreakdown = async () => ({
    data: [],
    error: null,
});
