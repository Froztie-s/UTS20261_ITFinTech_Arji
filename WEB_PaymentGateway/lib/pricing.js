// Shared by the UI and (later) the checkout API so totals always agree.
export const TAX_RATE = 0.11; // PPN 11%
export const SHIPPING_FEE = 10000;

export const calcTax = (subtotal) => Math.round(subtotal * TAX_RATE);
