import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Checkout from "@/models/Checkout";
import Payment from "@/models/Payment";
import { PAYMENT_TYPES, createSnapTransaction } from "@/lib/midtrans";
import { TAX_RATE } from "@/lib/pricing";

function baseUrl(req) {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || "http";
  return `${proto}://${req.headers.host}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { checkoutId } = req.body || {};
  if (!mongoose.isValidObjectId(checkoutId)) {
    return res.status(400).json({ error: "Invalid checkout id" });
  }

  try {
    await dbConnect();

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) return res.status(404).json({ error: "Checkout not found" });
    if (checkout.status === "paid") return res.status(409).json({ error: "Order is already paid" });

    // Double-click / retry safety: reuse the payment that is already waiting for this checkout
    const existing = await Payment.findOne({ checkoutId: checkout._id, status: "PENDING" });
    if (existing && existing.redirectUrl) {
      return res.status(200).json({
        paymentId: existing._id,
        orderId: existing.orderId,
        snapToken: existing.snapToken,
        redirectUrl: existing.redirectUrl,
      });
    }

    const orderId = `ORD-${checkout._id}-${Date.now().toString(36)}`;
    const payment = await Payment.create({
      checkoutId: checkout._id,
      orderId,
      amount: checkout.total,
    });

    // gross_amount must equal the sum of item_details, so tax is its own line
    const itemDetails = checkout.items.map((i) => ({
      id: String(i.productId),
      price: i.price,
      quantity: i.qty,
      name: i.name.slice(0, 50),
    }));
    itemDetails.push({
      id: "TAX",
      price: checkout.tax,
      quantity: 1,
      name: `Tax (${Math.round(TAX_RATE * 100)}%)`,
    });

    const payload = {
      transaction_details: { order_id: orderId, gross_amount: checkout.total },
      item_details: itemDetails,
      enabled_payments: PAYMENT_TYPES[checkout.paymentMethod] || PAYMENT_TYPES.card,
      expiry: { unit: "minutes", duration: 60 },
      callbacks: { finish: `${baseUrl(req)}/payment/${payment._id}` },
    };
    if (checkout.customer?.email) {
      payload.customer_details = { email: checkout.customer.email };
    }

    let snap;
    try {
      snap = await createSnapTransaction(payload);
    } catch (err) {
      await Payment.deleteOne({ _id: payment._id });
      console.error(err);
      return res.status(502).json({ error: "Could not start the payment. Please try again." });
    }

    payment.snapToken = snap.token;
    payment.redirectUrl = snap.redirect_url;
    await payment.save();

    return res.status(201).json({
      paymentId: payment._id,
      orderId,
      snapToken: snap.token,
      redirectUrl: snap.redirect_url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create payment" });
  }
}
