const SNAP_URL =
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

// Payment method chosen on the payment page -> Snap payment types to offer.
// Only cards use the Midtrans page (Snap); QRIS, BCA VA and Indomaret have our own pages.
export const PAYMENT_TYPES = {
  card: ["credit_card"],
};

// Methods that are charged through the Core API and shown on our own page
export const CUSTOM_METHODS = ["qris", "bca_va", "indomaret"];

const CHARGE_URL =
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://api.midtrans.com/v2/charge"
    : "https://api.sandbox.midtrans.com/v2/charge";

async function midtransPost(url, payload) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY is not set");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(data.error_messages) ? data.error_messages.join(", ") : `HTTP ${res.status}`;
    throw new Error(`Midtrans error: ${detail}`);
  }
  return data;
}

// Creates a Snap transaction and returns { token, redirect_url }
export function createSnapTransaction(payload) {
  return midtransPost(SNAP_URL, payload);
}

// How long each method stays payable (minutes)
export const VALID_MINUTES = { qris: 15, bca_va: 60, indomaret: 120 };
export const QRIS_VALID_MINUTES = VALID_MINUTES.qris;

// Core API charge. It answers HTTP 200 even when the charge is rejected,
// so the status code inside the body is checked too.
async function charge(method, { orderId, grossAmount, itemDetails, customerDetails }, methodFields, hasResult) {
  const data = await midtransPost(CHARGE_URL, {
    ...methodFields,
    transaction_details: { order_id: orderId, gross_amount: grossAmount },
    item_details: itemDetails,
    ...(customerDetails ? { customer_details: customerDetails } : {}),
    custom_expiry: { expiry_duration: VALID_MINUTES[method], unit: "minute" },
  });
  if (!["200", "201"].includes(String(data.status_code)) || !hasResult(data)) {
    throw new Error(`Midtrans error: ${data.status_message || "no payment details returned"}`);
  }
  return data;
}

// QRIS: returns { qr_string, actions, expiry_time, ... }
export function createQrisCharge(order) {
  return charge("qris", order, { payment_type: "qris", qris: { acquirer: "gopay" } }, (d) => !!d.qr_string);
}

// BCA virtual account: returns { va_numbers: [{ bank, va_number }], expiry_time, ... }
export function createBcaVaCharge(order) {
  return charge(
    "bca_va",
    order,
    { payment_type: "bank_transfer", bank_transfer: { bank: "bca" } },
    (d) => !!d.va_numbers?.[0]?.va_number
  );
}

// Indomaret: returns { payment_code, store, expiry_time, ... }
export function createIndomaretCharge(order) {
  return charge(
    "indomaret",
    order,
    { payment_type: "cstore", cstore: { store: "indomaret" } },
    (d) => !!d.payment_code
  );
}

// Midtrans times are "YYYY-MM-DD HH:mm:ss" in WIB (UTC+7)
export function parseMidtransTime(value) {
  const d = value ? new Date(`${value.replace(" ", "T")}+07:00`) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}
