/**
 * Shared pricing helpers for the Service Provider marketplace.
 *
 * A service has ONE rate and ONE unit chosen by the provider:
 *   unit = 'day'  → rate per worker per day   (price × days × workers)
 *   unit = 'job'  → flat rate for the whole job
 *   anything else → rate per unit supplied by the farmer (piece, plant, acre, …)
 *
 * Mirrors the billing rules in sp-service (booking.controller.js).
 */

export const COMMON_UNITS = ['day', 'hour', 'job', 'piece', 'plant', 'tree', 'acre', 'sq ft', 'metre', 'kg'];

export const billingMode = (unit) => (unit === 'day' ? 'per_day' : unit === 'job' ? 'flat' : 'per_unit');

const inr = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** "₹1,200 / day", "₹12.5 / plant", "₹5,000 fixed price per job" */
export const formatRate = (service) => {
    if (!service || service.price == null) return 'Contact for pricing';
    if (billingMode(service.unit) === 'flat') return `${inr(service.price)} per job`;
    return `${inr(service.price)} / ${service.unit}`;
};

/** Human description of how the final cost is worked out. */
export const describeBilling = (service) => {
    switch (billingMode(service?.unit)) {
        case 'per_day': return 'Charged per worker, per day';
        case 'flat': return 'Fixed price for the whole job';
        default: return `Charged per ${service?.unit} — you enter the quantity`;
    }
};

export const dayCount = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
    return Math.round((end - start) / 86400000) + 1;
};

/** Client-side estimate; the server computes the authoritative amount on hold. */
export const estimateAmount = (service, { startDate, endDate, workers = 1, quantity = 0 }) => {
    if (!service || service.price == null) return 0;
    const price = Number(service.price);
    switch (billingMode(service.unit)) {
        case 'per_day': return price * dayCount(startDate, endDate) * workers;
        case 'flat': return price;
        default: return Math.round(price * (Number(quantity) || 0) * 100) / 100;
    }
};

/** "200 plant" style label for a booking's quantity (per-unit services only). */
export const formatQuantity = (booking) =>
    booking?.quantity != null ? `${Number(booking.quantity).toLocaleString('en-IN')} ${booking.serviceUnit}` : null;
