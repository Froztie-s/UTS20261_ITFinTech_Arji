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

// Creates a Snap transaction and returns { token, redirect_url }
export async function createSnapTransaction(payload) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY is not set");

  const res = await fetch(SNAP_URL, {
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
