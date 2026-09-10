/**
 * workerApi.js
 *
 * Thin client for the Worker Microservice (port 4002).
 * All requests include the stored JWT from tokenStore.
 * Returns { data, error } — never throws.
 */

import { tokenStore } from './apiClient';

const WORKER_SERVICE_URL = 'http://localhost:4002';

const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenStore.getAccess()}`,
});

const call = async (method, path, body) => {
    try {
        const res = await fetch(`${WORKER_SERVICE_URL}${path}`, {
            method,
            headers: headers(),
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { data: null, error: data.error || `Error ${res.status}` };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err.message || 'Network error' };
    }
};

// ── Workers ───────────────────────────────────────────────────────────────────
/** List all ACTIVE workers for a farm */
export const getWorkers = (farmId) =>
    call('GET', `/workers?farm_id=${farmId}`);

/** List all INACTIVE workers for a farm */
export const getInactiveWorkers = (farmId) =>
    call('GET', `/workers/inactive?farm_id=${farmId}`);

/** Add a new worker */
export const createWorker = (body) => call('POST', '/workers', body);

/** Update worker name/role/contact/salary/skills */
export const updateWorker = (id, body) => call('PUT', `/workers/${id}`, body);

/** Archive (is_active:false) or re-activate (is_active:true) a worker */
export const setWorkerStatus = (id, body) =>
    call('PATCH', `/workers/${id}/status`, body);

// ── Attendance ────────────────────────────────────────────────────────────────
/** Get attendance records.  month = 'YYYY-MM' (optional, defaults to today) */
export const getAttendance = (farmId, month) => {
    const params = new URLSearchParams({ farm_id: farmId });
    if (month) params.append('month', month);
    return call('GET', `/attendance?${params}`);
};

/** Upsert a single attendance record { worker_id, farm_id, date, status } */
export const upsertAttendance = (body) => call('POST', '/attendance', body);

// ── Finance & Payroll ─────────────────────────────────────────────────────────
/** Get payroll summary for a date range (weekly/monthly) */
export const getPayrollSummary = (farmId, fromDate, toDate) => {
    const params = new URLSearchParams({ farm_id: farmId });
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    return call('GET', `/finance/payroll-summary?${params}`);
};

/** Record a cash advance given to a worker */
export const recordAdvance = (body) => call('POST', '/finance/advance', body);

/** Record a loan settlement repayment from worker */
export const recordLoanSettlement = (body) => call('POST', '/finance/loan-settlement', body);

/** Credit period salary to worker's deposit balance */
export const accrueSalary = (body) => call('POST', '/finance/accrue-salary', body);

/** Process a salary payout (with optional loan deduction) */
export const processPayout = (body) => call('POST', '/finance/payout', body);

/** Get financial transactions audit log */
export const getFinanceTransactions = (farmId, workerId, type) => {
    const params = new URLSearchParams({ farm_id: farmId });
    if (workerId) params.append('worker_id', workerId);
    if (type) params.append('type', type);
    return call('GET', `/finance/transactions?${params}`);
};
