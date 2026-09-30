import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Checkout from "@/models/Checkout";

// Midtrans transaction_status -> our Payment status
function mapStatus(n) {
  switch (n.transaction_status) {
    case "settlement":
      return "LUNAS";
    case "capture":
      // Card payments: only paid when the fraud check accepts it
      return n.fraud_status === "accept" || !n.fraud_status ? "LUNAS" : "PENDING";
    case "pending":
      return "PENDING";
    case "expire":
      return "EXPIRED";
    case "cancel":
    case "deny":
    case "failure":
      return "FAILED";
    default:
      return null;
  }
}

// signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
function validSignature(n) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey || !n.signature_key) return false;
  const expected = crypto
    .createHash("sha512")
    .update(`${n.order_id}${n.status_code}${n.gross_amount}${serverKey}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(n.signature_key));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const n = req.body || {};

  if (!validSignature(n)) {
    console.warn("[midtrans webhook] invalid signature for", n.order_id);
    return res.status(403).json({ error: "Invalid signature" });
  }

  try {
    await dbConnect();

    const payment = await Payment.findOne({ orderId: n.order_id });
    if (!payment) {
      // e.g. the "Test notification" button in the Midtrans dashboard
      console.warn("[midtrans webhook] unknown order", n.order_id);
      return res.status(200).json({ ok: true, ignored: true });
    }

    // The amount Midtrans reports must match what we billed
    if (Math.round(Number(n.gross_amount)) !== payment.amount) {
      console.error("[midtrans webhook] amount mismatch for", n.order_id);
      return res.status(400).json({ error: "Amount mismatch" });
    }

    const next = mapStatus(n);

    // A paid order never goes backwards, and repeated notifications change nothing
    if (next && payment.status !== "LUNAS" && next !== payment.status) {
      payment.status = next;
      if (next === "LUNAS") payment.paidAt = n.settlement_time ? new Date(n.settlement_time + " +0700") : new Date();
    }
    payment.rawNotification = n;
    await payment.save();

    if (payment.status === "LUNAS") {
      await Checkout.updateOne({ _id: payment.checkoutId }, { $set: { status: "paid" } });
    }

    return res.status(200).json({ ok: true, status: payment.status });
  } catch (err) {
    console.error(err);
    // Non-2xx makes Midtrans retry the notification later
    return res.status(500).json({ error: "Failed to process notification" });
  }
}
