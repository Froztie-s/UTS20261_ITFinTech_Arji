const SNAP_URL =
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

// Payment method chosen on the payment page -> Snap payment types to offer
export const PAYMENT_TYPES = {
  card: ["credit_card"],
  qris: ["other_qris"],
  other: ["gopay", "shopeepay", "ovo", "dana", "bank_transfer"],
};

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

export const QRIS_VALID_MINUTES = 15;

// Creates a QRIS charge (Core API) and returns { qr_string, expiry_time, ... }
export async function createQrisCharge({ orderId, grossAmount, itemDetails, customerDetails }) {
  const data = await midtransPost(CHARGE_URL, {
    payment_type: "qris",
    transaction_details: { order_id: orderId, gross_amount: grossAmount },
    item_details: itemDetails,
    ...(customerDetails ? { customer_details: customerDetails } : {}),
    qris: { acquirer: "gopay" },
    custom_expiry: { expiry_duration: QRIS_VALID_MINUTES, unit: "minute" },
  });
  // Core API answers 200 even when the charge is rejected; check the status code inside
  if (!["200", "201"].includes(String(data.status_code)) || !data.qr_string) {
    throw new Error(`Midtrans error: ${data.status_message || "no QR code returned"}`);
  }
  return data;
}

// Midtrans times are "YYYY-MM-DD HH:mm:ss" in WIB (UTC+7)
export function parseMidtransTime(value) {
  const d = value ? new Date(`${value.replace(" ", "T")}+07:00`) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}
