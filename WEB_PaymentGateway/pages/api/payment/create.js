import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Checkout from "@/models/Checkout";
import Payment from "@/models/Payment";
import {
  CUSTOM_METHODS,
  VALID_MINUTES,
  createBcaVaCharge,
  createIndomaretCharge,
  createQrisCharge,
  parseMidtransTime,
} from "@/lib/midtrans";
import { TAX_RATE } from "@/lib/pricing";

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

    const method = checkout.paymentMethod;
    if (!CUSTOM_METHODS.includes(method)) {
      return res.status(400).json({ error: "This payment method is no longer available" });
    }

    // Double-click / retry safety: reuse the payment that is already waiting for this checkout
    const existing = await Payment.findOne({ checkoutId: checkout._id, status: "PENDING" });
    const hasDetails = (p) =>
      method === "qris" ? !!p.qrString : method === "bca_va" ? !!p.vaNumber : !!p.paymentCode;
    if (existing && hasDetails(existing) && existing.expiresAt > new Date()) {
      return res.status(200).json({ paymentId: existing._id, orderId: existing.orderId, method });
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
    const customerDetails = checkout.customer?.email ? { email: checkout.customer.email } : null;

    try {
      // Every method is charged through the Core API and shown on our own page
      const order = { orderId, grossAmount: checkout.total, itemDetails, customerDetails };
      let result;
      if (method === "qris") {
        result = await createQrisCharge(order);
        payment.qrString = result.qr_string;
        payment.qrImageUrl = result.actions?.find((a) => a.name === "generate-qr-code")?.url || "";
      } else if (method === "bca_va") {
        result = await createBcaVaCharge(order);
        payment.vaNumber = result.va_numbers[0].va_number;
      } else {
        result = await createIndomaretCharge(order);
        payment.paymentCode = result.payment_code;
      }
      payment.expiresAt =
        parseMidtransTime(result.expiry_time) || new Date(Date.now() + VALID_MINUTES[method] * 60 * 1000);
    } catch (err) {
      await Payment.deleteOne({ _id: payment._id });
      console.error(err);
      return res.status(502).json({ error: "Could not start the payment. Please try again." });
    }

    await payment.save();

    return res.status(201).json({ paymentId: payment._id, orderId, method });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create payment" });
  }
}
