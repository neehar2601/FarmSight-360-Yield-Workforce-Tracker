import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { spProviderApi } from '../../utils/spApi';
import { InvoiceStatusBadge, InvoiceThread, InvoiceDocument, money } from '../billing/billingUi';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
let keySeq = 0;
const toLine = (it) => ({
    key: it.id || `new-${++keySeq}`, kind: it.kind || 'service', description: it.description || '',
    quantity: String(it.quantity ?? 1), unit: it.unit || 'job', rate: String(it.rate ?? 0),
});
const lineAmount = (l) => {
    const a = round2((Number(l.quantity) || 0) * (Number(l.rate) || 0));
    return l.kind === 'discount' ? -a : a;
};
const inputCls = 'w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60';

/**
 * Provider's bill editor: adjust work done (plants / hours / days), add extra
 * costs or discounts, send to the farmer, answer discrepancies, and confirm
 * cash once received.
 */
const SPInvoiceModal = ({ invoiceId, onClose, onChanged }) => {
    const [invoice, setInvoice] = useState(null);
    const [events, setEvents] = useState([]);
    const [lines, setLines] = useState([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('bill'); // 'bill' | 'document'
    const [cashOpen, setCashOpen] = useState(false);
    const [cashRef, setCashRef] = useState('');

    const hydrate = useCallback((res) => {
        setInvoice(res.invoice);
        if (res.events) setEvents(res.events);
        setLines(res.invoice.items.map(toLine));
        setNote(res.invoice.spNote || '');
    }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await spProviderApi.getInvoice(invoiceId);
                if (alive) hydrate(res);
            } catch (err) {
                if (alive) setError(err.message || 'Failed to load bill');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [invoiceId, hydrate]);

    const editable = invoice && invoice.status !== 'paid';
    const total = useMemo(() => round2(lines.reduce((s, l) => s + lineAmount(l), 0)), [lines]);
    const dirty = useMemo(() => {
        if (!invoice) return false;
        const orig = JSON.stringify({ items: invoice.items.map((i) => [i.kind, i.description, Number(i.quantity), i.unit, Number(i.rate)]), note: invoice.spNote || '' });
        const now = JSON.stringify({ items: lines.map((l) => [l.kind, l.description.trim(), Number(l.quantity), l.unit.trim().toLowerCase(), Number(l.rate)]), note: note.trim() });
        return orig !== now;
    }, [invoice, lines, note]);

    const setLine = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    const addLine = (kind) => setLines((ls) => [...ls, toLine({ kind, description: '', quantity: 1, unit: kind === 'service' ? (ls[0]?.unit || 'job') : 'job', rate: 0 })]);
    const removeLine = (key) => setLines((ls) => ls.filter((l) => l.key !== key));

    const payload = () => ({
        items: lines.map((l) => ({ kind: l.kind, description: l.description, quantity: Number(l.quantity), unit: l.unit, rate: Number(l.rate) })),
        note,
    });

    const run = async (fn) => {
        setBusy(true); setError('');
        try {
            const res = await fn();
            hydrate(res);
            onChanged && onChanged();
            return res;
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setBusy(false);
        }
    };

    const save = () => run(() => spProviderApi.updateInvoice(invoice.id, payload()));
    const send = () => run(async () => {
        if (dirty || invoice.status !== 'draft') await spProviderApi.updateInvoice(invoice.id, payload());
        return spProviderApi.issueInvoice(invoice.id, note);
    });
    const confirmCash = () => run(async () => {
        const res = await spProviderApi.confirmCashPayment(invoice.id, cashRef);
        setCashOpen(false);
        return res;
    });
    const post = async (message) => {
        const res = await spProviderApi.messageInvoice(invoice.id, message);
        setEvents(res.events);
    };

    const lastDispute = [...events].reverse().find((e) => e.type === 'disputed');
    const diff = invoice ? total - (invoice.estimatedAmount ?? total) : 0;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full border border-gray-100 dark:border-slate-700 shadow-2xl my-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                                {invoice ? `Bill ${invoice.invoiceNumber}` : 'Bill'}
                            </h3>
                            {invoice && <InvoiceStatusBadge status={invoice.status} viewer="sp" />}
                            {invoice && invoice.revision > 0 && invoice.status !== 'paid' && (
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">version {invoice.revision}</span>
                            )}
                        </div>
                        {invoice && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                {invoice.farmUserName || 'Farmer'} · {invoice.serviceName} · {invoice.startDate}{invoice.endDate !== invoice.startDate ? ` → ${invoice.endDate}` : ''}
                            </p>
                        )}
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close"
                        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700">✕</button>
                </div>

                {loading ? (
                    <div className="p-16 text-center text-xs text-gray-500 dark:text-gray-400">Loading bill…</div>
                ) : !invoice ? (
                    <div className="p-8 text-center text-sm text-rose-600 dark:text-rose-400">{error || 'Bill not found'}</div>
                ) : (
                    <div className="p-6 space-y-5">
                        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-700/60 w-fit">
                            {[['bill', 'Bill details'], ['document', 'Printable invoice']].map(([id, label]) => (
                                <button key={id} type="button" onClick={() => setTab(id)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === id ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">{error}</div>}

                        {tab === 'document' ? (
                            <InvoiceDocument invoice={{ ...invoice, items: invoice.items }} />
                        ) : (
                            <>
                                {invoice.status === 'disputed' && lastDispute && (
                                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                                        <p className="font-bold">⚠️ The farmer reported a discrepancy</p>
                                        <p className="italic">“{lastDispute.message}”</p>
                                        <p className="opacity-80">Adjust the bill below and send it again, or reply in the messages.</p>
                                    </div>
                                )}
                                {invoice.status === 'paid' && (
                                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                                        <p className="font-bold">✅ Paid {money(invoice.totalAmount)} via <span className="capitalize">{invoice.paymentMethod}</span></p>
                                        <p className="opacity-80 mt-0.5">Receipt {invoice.receiptNumber} has been sent to the farmer.</p>
                                    </div>
                                )}
                                {invoice.status === 'issued' && (
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
                                        Sent to the farmer for verification. If you edit it now it returns to draft and must be re-sent.
                                    </div>
                                )}

                                {/* Line items */}
                                <div className="space-y-2">
                                    <div className="hidden sm:grid grid-cols-12 gap-2 px-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        <span className="col-span-4">Description</span>
                                        <span className="col-span-2">Type</span>
                                        <span className="col-span-1">Qty</span>
                                        <span className="col-span-2">Unit</span>
                                        <span className="col-span-1">Rate ₹</span>
                                        <span className="col-span-2 text-right">Amount</span>
                                    </div>
                                    {lines.map((l) => (
                                        <div key={l.key} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700">
                                            <input className={`${inputCls} col-span-12 sm:col-span-4`} value={l.description} disabled={!editable} maxLength={200}
                                                placeholder="e.g. Areca planting" onChange={(e) => setLine(l.key, { description: e.target.value })} aria-label="Description" />
                                            <select className={`${inputCls} col-span-6 sm:col-span-2`} value={l.kind} disabled={!editable}
                                                onChange={(e) => setLine(l.key, { kind: e.target.value })} aria-label="Type">
                                                <option value="service">Work</option>
                                                <option value="extra">Extra cost</option>
                                                <option value="discount">Discount</option>
                                            </select>
                                            <input className={`${inputCls} col-span-3 sm:col-span-1`} type="number" min="0" step="any" value={l.quantity} disabled={!editable}
                                                onChange={(e) => setLine(l.key, { quantity: e.target.value })} aria-label="Quantity" />
                                            <input className={`${inputCls} col-span-3 sm:col-span-2`} value={l.unit} disabled={!editable} maxLength={30}
                                                onChange={(e) => setLine(l.key, { unit: e.target.value })} aria-label="Unit" />
                                            <input className={`${inputCls} col-span-6 sm:col-span-1`} type="number" min="0" step="any" value={l.rate} disabled={!editable}
                                                onChange={(e) => setLine(l.key, { rate: e.target.value })} aria-label="Rate" />
                                            <div className="col-span-5 sm:col-span-2 text-right text-xs font-bold text-gray-900 dark:text-white flex items-center justify-end gap-1.5">
                                                <span className={l.kind === 'discount' ? 'text-rose-600 dark:text-rose-400' : ''}>{lineAmount(l) < 0 ? '−' : ''}{money(Math.abs(lineAmount(l)))}</span>
                                                {editable && lines.length > 1 && (
                                                    <button type="button" onClick={() => removeLine(l.key)} aria-label="Remove line"
                                                        className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400">✕</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {editable && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <button type="button" onClick={() => addLine('service')} className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40">+ Work item</button>
                                            <button type="button" onClick={() => addLine('extra')} className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/40">+ Extra cost</button>
                                            <button type="button" onClick={() => addLine('discount')} className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40">+ Discount</button>
                                        </div>
                                    )}
                                </div>

                                {/* Totals */}
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-700">
                                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                                        {invoice.estimatedAmount != null && (
                                            <p>Original estimate: <strong className="text-gray-900 dark:text-white">{money(invoice.estimatedAmount)}</strong></p>
                                        )}
                                        {invoice.estimatedAmount != null && Math.abs(diff) > 0.004 && (
                                            <p className={diff > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>
                                                {diff > 0 ? '▲' : '▼'} {money(Math.abs(diff))} {diff > 0 ? 'above' : 'below'} estimate
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 block">Bill total</span>
                                        <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{money(total)}</span>
                                    </div>
                                </div>

                                {editable && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Note to farmer (optional)</label>
                                        <textarea rows={2} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)}
                                            placeholder="e.g. 12 extra saplings planted at the east boundary"
                                            className={`${inputCls} text-xs`} />
                                    </div>
                                )}

                                {/* Cash confirmation */}
                                {(invoice.status === 'issued' || invoice.status === 'approved') && !dirty && (
                                    <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-3">
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">💵 Collect payment</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                                    Received cash from the farmer? Confirm it and the receipt is sent to them automatically. (Online payments are recorded automatically.)
                                                </p>
                                            </div>
                                            {!cashOpen && (
                                                <button type="button" onClick={() => setCashOpen(true)}
                                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm">
                                                    Confirm cash received
                                                </button>
                                            )}
                                        </div>
                                        {cashOpen && (
                                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                                <input className={`${inputCls} sm:flex-1`} value={cashRef} onChange={(e) => setCashRef(e.target.value)} maxLength={200}
                                                    placeholder="Reference (optional) — e.g. receipt book no." />
                                                <button type="button" disabled={busy} onClick={confirmCash}
                                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap">
                                                    {busy ? 'Saving…' : `Yes, I received ${money(invoice.totalAmount)}`}
                                                </button>
                                                <button type="button" onClick={() => setCashOpen(false)} className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <InvoiceThread events={events} onPost={post} canPost={invoice.status !== 'draft'} />

                                {/* Primary actions */}
                                {editable && (
                                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                                        <button type="button" onClick={onClose}
                                            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-200">
                                            Close
                                        </button>
                                        {dirty && (
                                            <button type="button" disabled={busy} onClick={save}
                                                className="px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-60">
                                                Save as draft
                                            </button>
                                        )}
                                        {(invoice.status === 'draft' || invoice.status === 'disputed' || dirty) && (
                                            <button type="button" disabled={busy || total <= 0} onClick={send}
                                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold shadow-md">
                                                {busy ? 'Sending…' : invoice.revision > 0 ? 'Send revised bill to farmer' : 'Send bill to farmer'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SPInvoiceModal;
