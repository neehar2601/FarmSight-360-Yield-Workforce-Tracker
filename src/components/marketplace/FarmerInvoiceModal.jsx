import React, { useState, useEffect, useCallback, useRef } from 'react';
import { spFarmerBookingApi } from '../../utils/spApi';
import { InvoiceStatusBadge, InvoiceThread, InvoiceDocument, money } from '../billing/billingUi';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = RAZORPAY_SCRIPT; s.onload = resolve; s.onerror = () => reject(new Error('Could not load the payment window'));
    document.body.appendChild(s);
});

/**
 * Farmer's view of a provider's bill: verify the numbers, report a discrepancy,
 * pay (cash → provider confirms / online → settles automatically) and keep the
 * receipt.
 */
const FarmerInvoiceModal = ({ invoiceId, onClose, onChanged }) => {
    const [invoice, setInvoice] = useState(null);
    const [events, setEvents] = useState([]);
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('bill'); // 'bill' | 'document'
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [disputeText, setDisputeText] = useState('');
    const [simulating, setSimulating] = useState(false); // test-gateway dialog open
    const [waitingPayment, setWaitingPayment] = useState(false);
    const pollRef = useRef(null);

    const hydrate = useCallback((res) => {
        setInvoice(res.invoice);
        if (res.events) setEvents(res.events);
        if (res.paymentMethods) setMethods(res.paymentMethods);
    }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await spFarmerBookingApi.getInvoice(invoiceId);
                if (alive) hydrate(res);
            } catch (err) {
                if (alive) setError(err.message || 'Failed to load bill');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; clearInterval(pollRef.current); };
    }, [invoiceId, hydrate]);

    const run = async (fn) => {
        setBusy(true); setError('');
        try {
            const res = await fn();
            if (res) hydrate(res);
            onChanged && onChanged();
            return res;
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setBusy(false);
        }
    };

    const approve = () => run(() => spFarmerBookingApi.approveInvoice(invoice.id));
    const dispute = () => run(async () => {
        const res = await spFarmerBookingApi.disputeInvoice(invoice.id, disputeText);
        setDisputeOpen(false); setDisputeText('');
        return res;
    });
    const post = async (message) => {
        const res = await spFarmerBookingApi.messageInvoice(invoice.id, message);
        setEvents(res.events);
    };

    /** Gateways settle server-side via webhook, so after checkout we poll until the bill flips to paid. */
    const pollUntilPaid = () => {
        setWaitingPayment(true);
        let tries = 0;
        clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            tries += 1;
            try {
                const res = await spFarmerBookingApi.getInvoice(invoice.id);
                if (res.invoice.status === 'paid') {
                    clearInterval(pollRef.current); setWaitingPayment(false); hydrate(res); onChanged && onChanged();
                }
            } catch { /* keep polling */ }
            if (tries >= 20) { clearInterval(pollRef.current); setWaitingPayment(false); }
        }, 2000);
    };

    const payOnline = (gateway) => run(async () => {
        const order = await spFarmerBookingApi.startOnlinePayment(invoice.id, gateway);
        if (order.checkout?.kind === 'simulated') {
            setSimulating(true);
        } else if (order.checkout?.kind === 'razorpay') {
            await loadRazorpay();
            const c = order.checkout;
            new window.Razorpay({
                key: c.keyId, order_id: c.orderId, amount: c.amount, currency: c.currency,
                name: c.name, description: c.description,
                handler: pollUntilPaid,
            }).open();
        } else {
            throw new Error('This payment method is not supported yet');
        }
        return null;
    });

    const simulate = (outcome) => run(async () => {
        const res = await spFarmerBookingApi.simulateOnlinePayment(invoice.id, outcome);
        setSimulating(false);
        if (outcome === 'failed') setError('The test payment failed. The bill is still unpaid — you can try again.');
        return res;
    });

    const diff = invoice && invoice.estimatedAmount != null ? invoice.totalAmount - invoice.estimatedAmount : 0;
    const payable = invoice && ['issued', 'approved'].includes(invoice.status);
    const onlineMethods = methods.filter((m) => m.type === 'online');
    const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-gray-100 dark:border-slate-700 shadow-2xl my-6">
                <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{invoice ? `Bill ${invoice.invoiceNumber}` : 'Bill'}</h3>
                            {invoice && <InvoiceStatusBadge status={invoice.status} viewer="farmer" />}
                        </div>
                        {invoice && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                {invoice.spName} · {invoice.serviceName} · {invoice.startDate}{invoice.endDate !== invoice.startDate ? ` → ${invoice.endDate}` : ''}
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
                            {[['bill', invoice.status === 'paid' ? 'Summary' : 'Verify & pay'], ['document', invoice.status === 'paid' ? 'Receipt' : 'Printable invoice']].map(([id, label]) => (
                                <button key={id} type="button" onClick={() => setTab(id)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === id ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">{error}</div>}

                        {tab === 'document' ? <InvoiceDocument invoice={invoice} /> : (
                            <>
                                {invoice.status === 'paid' && (
                                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                                        <p className="font-bold">✅ Paid {money(invoice.totalAmount)} via <span className="capitalize">{invoice.paymentMethod}</span></p>
                                        <p className="opacity-80 mt-0.5">Receipt {invoice.receiptNumber} — open the “Receipt” tab to print or save it. It was also emailed to you if email is set up.</p>
                                    </div>
                                )}
                                {invoice.status === 'disputed' && (
                                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">
                                        <p className="font-bold">Your discrepancy was sent to {invoice.spName}</p>
                                        <p className="opacity-80 mt-0.5">They will revise the bill and send it again — you’ll be able to pay once it’s re-issued.</p>
                                    </div>
                                )}
                                {invoice.status === 'issued' && (
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
                                        Please check the quantities and amounts below against the work done. Approve if it’s right, or report anything that looks off.
                                    </div>
                                )}

                                {/* Bill */}
                                <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                                    {invoice.items.map((it) => (
                                        <div key={it.id} className="flex items-start justify-between gap-3 px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-slate-700 text-xs">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {it.description}
                                                    {it.kind === 'extra' && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold">EXTRA</span>}
                                                    {it.kind === 'discount' && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-[10px] font-bold">DISCOUNT</span>}
                                                </p>
                                                <p className="text-gray-500 dark:text-gray-400 mt-0.5">{Number(it.quantity)} {it.unit} × {money(it.rate)}</p>
                                            </div>
                                            <span className={`font-bold whitespace-nowrap ${it.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
                                                {it.amount < 0 ? '−' : ''}{money(Math.abs(it.amount))}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex items-end justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-slate-700/40">
                                        <div className="text-xs text-gray-600 dark:text-gray-300">
                                            {invoice.estimatedAmount != null && (
                                                <p>Original estimate: <strong className="text-gray-900 dark:text-white">{money(invoice.estimatedAmount)}</strong></p>
                                            )}
                                            {invoice.estimatedAmount != null && Math.abs(diff) > 0.004 && (
                                                <p className={diff > 0 ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400 font-semibold'}>
                                                    {diff > 0 ? '▲' : '▼'} {money(Math.abs(diff))} {diff > 0 ? 'more' : 'less'} than estimated
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 block">Total</span>
                                            <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{money(invoice.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                                {invoice.spNote && (
                                    <p className="text-xs p-3 rounded-xl bg-gray-50 dark:bg-slate-700/40 text-gray-700 dark:text-gray-200">
                                        <strong>Note from {invoice.spName}:</strong> {invoice.spNote}
                                    </p>
                                )}

                                {/* Verify */}
                                {invoice.status === 'issued' && !disputeOpen && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button type="button" disabled={busy} onClick={approve}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold shadow-sm">
                                            ✓ Looks correct
                                        </button>
                                        <button type="button" onClick={() => setDisputeOpen(true)}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold">
                                            Report a discrepancy
                                        </button>
                                    </div>
                                )}
                                {invoice.status === 'approved' && !disputeOpen && (
                                    <button type="button" onClick={() => setDisputeOpen(true)}
                                        className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline">
                                        Spotted a problem after all? Report a discrepancy
                                    </button>
                                )}
                                {disputeOpen && payable && (
                                    <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 space-y-2">
                                        <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200">What looks wrong?</label>
                                        <textarea rows={3} value={disputeText} maxLength={1000} onChange={(e) => setDisputeText(e.target.value)}
                                            placeholder="e.g. Only 110 plants were planted, not 112" className={inputCls} />
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => setDisputeOpen(false)} className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300">Cancel</button>
                                            <button type="button" disabled={busy || disputeText.trim().length < 3} onClick={dispute}
                                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-semibold">
                                                Send to provider
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Pay */}
                                {payable && !disputeOpen && (
                                    <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 space-y-3">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">How would you like to pay {money(invoice.totalAmount)}?</p>
                                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700/40 text-xs text-gray-700 dark:text-gray-200 flex gap-2">
                                            <span>💵</span>
                                            <p><strong>Cash</strong> — hand the amount to {invoice.spName}. They’ll confirm it in the app and your receipt appears here automatically.</p>
                                        </div>
                                        {onlineMethods.map((m) => (
                                            <button key={m.id} type="button" disabled={busy || waitingPayment} onClick={() => payOnline(m.id)}
                                                className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold shadow-sm flex items-center justify-between">
                                                <span>💳 {m.label}</span>
                                                <span>{money(invoice.totalAmount)} →</span>
                                            </button>
                                        ))}
                                        {waitingPayment && <p className="text-xs text-blue-700 dark:text-blue-300 animate-pulse">Waiting for payment confirmation…</p>}
                                    </div>
                                )}

                                <InvoiceThread events={events} onPost={post} />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Test gateway dialog */}
            {simulating && (
                <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 border border-gray-100 dark:border-slate-700 shadow-2xl space-y-4 text-center">
                        <div className="text-3xl">🧪</div>
                        <h4 className="text-base font-bold text-gray-900 dark:text-white">Test payment gateway</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            No real money moves. This pretends to be the gateway and notifies the server of the result — exactly like a real payment would.
                        </p>
                        <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{money(invoice?.totalAmount)}</p>
                        <div className="flex gap-2">
                            <button type="button" disabled={busy} onClick={() => simulate('failed')}
                                className="flex-1 px-3 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-semibold">Fail payment</button>
                            <button type="button" disabled={busy} onClick={() => simulate('succeeded')}
                                className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">Pay now</button>
                        </div>
                        <button type="button" onClick={() => setSimulating(false)} className="text-xs text-gray-500 dark:text-gray-400 underline">Close without paying</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmerInvoiceModal;
