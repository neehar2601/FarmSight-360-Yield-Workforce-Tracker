import React, { useState } from 'react';

/** Shared bits for the bill views used by both the provider portal and the farmer app. */

export const money = (n) =>
    `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDateTime = (iso) =>
    iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_STYLES = {
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-500' },
    issued: { label: 'Sent — awaiting farmer', cls: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
    disputed: { label: 'Discrepancy reported', cls: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800' },
    approved: { label: 'Verified — payment due', cls: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' },
    paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' },
};

/** `viewer`: 'sp' | 'farmer' — only the wording of "issued" differs. */
export const InvoiceStatusBadge = ({ status, viewer = 'sp' }) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
    const label = status === 'issued' && viewer === 'farmer' ? 'Bill received — please verify' : s.label;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>{label}</span>
    );
};

const EVENT_STYLES = {
    provider: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100',
    farmer: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100',
    system: 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200',
};
const ACTOR_LABEL = { provider: 'Service provider', farmer: 'Farmer', system: 'System' };

/** Activity + discrepancy conversation. `canPost` hides the composer for drafts. */
export const InvoiceThread = ({ events = [], onPost, canPost = true }) => {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!text.trim() || !onPost) return;
        setBusy(true);
        try { await onPost(text.trim()); setText(''); } finally { setBusy(false); }
    };

    return (
        <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Activity &amp; messages</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {events.length === 0 && <p className="text-xs italic text-gray-500 dark:text-gray-400">Nothing yet.</p>}
                {events.map((ev) => (
                    <div key={ev.id} className={`px-3 py-2 rounded-xl border text-xs ${EVENT_STYLES[ev.actor] || EVENT_STYLES.system}`}>
                        <div className="flex justify-between gap-3 font-semibold opacity-80">
                            <span>{ACTOR_LABEL[ev.actor]}{ev.type === 'disputed' ? ' · reported a discrepancy' : ''}</span>
                            <span className="font-normal opacity-70 whitespace-nowrap">{fmtDateTime(ev.createdAt)}</span>
                        </div>
                        {ev.message && <p className="mt-0.5 leading-relaxed">{ev.message}</p>}
                    </div>
                ))}
            </div>
            {canPost && onPost && (
                <form onSubmit={submit} className="flex gap-2">
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={1000}
                        placeholder="Write a message…"
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button type="submit" disabled={busy || !text.trim()}
                        className="px-3 py-2 rounded-xl bg-gray-800 dark:bg-slate-600 text-white text-xs font-semibold disabled:opacity-50">
                        Send
                    </button>
                </form>
            )}
        </div>
    );
};

/**
 * Printable invoice / receipt. Always rendered on white with dark text so it
 * prints correctly regardless of the app theme. "Print / Save PDF" uses the
 * browser's print dialog (choose "Save as PDF").
 */
export const InvoiceDocument = ({ invoice }) => {
    if (!invoice) return null;
    const isPaid = invoice.status === 'paid';
    return (
        <div>
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
                    #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
                    .no-print { display: none !important; }
                }
            `}</style>
            <div className="no-print flex justify-end mb-3">
                <button type="button" onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5">
                    🖨️ Print / Save as PDF
                </button>
            </div>

            <div id="invoice-print-area" className="bg-white text-gray-900 rounded-2xl border border-gray-300 p-6 sm:p-8 text-sm shadow-sm">
                <div className="flex justify-between items-start gap-4 pb-4 border-b-2 border-emerald-600">
                    <div>
                        <p className="text-lg font-extrabold text-emerald-700">🌿 Farm360</p>
                        <p className="text-xs text-gray-500">Service marketplace</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-extrabold tracking-wide">{isPaid ? 'PAYMENT RECEIPT' : 'INVOICE'}</p>
                        <p className="text-xs text-gray-600">Invoice no. <strong>{invoice.invoiceNumber}</strong></p>
                        {isPaid && <p className="text-xs text-gray-600">Receipt no. <strong>{invoice.receiptNumber}</strong></p>}
                        <p className="text-xs text-gray-600">{isPaid ? `Paid on ${fmtDateTime(invoice.paidAt)}` : `Issued ${fmtDateTime(invoice.issuedAt || invoice.createdAt)}`}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                    <div>
                        <p className="uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Billed by</p>
                        <p className="font-bold text-sm">{invoice.spName}</p>
                        {invoice.spLocation && <p className="text-gray-600">{invoice.spLocation}</p>}
                        {invoice.spPhone && <p className="text-gray-600">📞 {invoice.spPhone}</p>}
                    </div>
                    <div>
                        <p className="uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Billed to</p>
                        <p className="font-bold text-sm">{invoice.farmUserName || 'Farmer'}</p>
                        {invoice.farmUserEmail && <p className="text-gray-600">{invoice.farmUserEmail}</p>}
                    </div>
                </div>

                <p className="text-xs text-gray-700 mb-2">
                    <strong>{invoice.serviceName}</strong> ({invoice.serviceCategory}) · {invoice.startDate}{invoice.endDate !== invoice.startDate ? ` → ${invoice.endDate}` : ''}
                </p>

                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-emerald-50 text-left text-gray-700">
                            <th className="p-2 font-semibold">Description</th>
                            <th className="p-2 font-semibold">Qty</th>
                            <th className="p-2 font-semibold">Rate</th>
                            <th className="p-2 font-semibold text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((it) => (
                            <tr key={it.id} className="border-b border-gray-200">
                                <td className="p-2">
                                    {it.description}
                                    {it.kind === 'extra' && <span className="ml-1 text-[10px] text-amber-700">(extra)</span>}
                                    {it.kind === 'discount' && <span className="ml-1 text-[10px] text-rose-700">(discount)</span>}
                                </td>
                                <td className="p-2 whitespace-nowrap">{Number(it.quantity)} {it.unit}</td>
                                <td className="p-2 whitespace-nowrap">{money(it.rate)}</td>
                                <td className="p-2 text-right whitespace-nowrap">{it.amount < 0 ? '−' : ''}{money(Math.abs(it.amount))}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={3} className="p-2 text-right font-bold text-sm">{isPaid ? 'Total paid' : 'Total due'}</td>
                            <td className="p-2 text-right font-extrabold text-sm">{money(invoice.totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>

                {invoice.spNote && <p className="mt-3 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2.5">Note from provider: {invoice.spNote}</p>}

                <div className="mt-5 pt-3 border-t border-gray-200 text-xs text-gray-600 flex justify-between items-center">
                    <span>
                        {isPaid
                            ? <>✅ Paid via <strong className="capitalize">{invoice.paymentMethod}</strong></>
                            : 'Payment pending'}
                    </span>
                    <span className="text-gray-400">Generated by Farm360</span>
                </div>
            </div>
        </div>
    );
};
