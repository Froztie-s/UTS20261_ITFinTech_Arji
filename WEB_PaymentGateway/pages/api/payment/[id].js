import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Checkout from "@/models/Checkout";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: "Payment not found" });
  }

  try {
    await dbConnect();

    const payment = await Payment.findById(id).lean();
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const checkout = await Checkout.findById(payment.checkoutId).lean();

    // Never expose the raw gateway notification or the Snap token
    return res.status(200).json({
      id: payment._id,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
      paidAt: payment.paidAt || null,
      createdAt: payment.createdAt,
      redirectUrl: payment.status === "PENDING" ? payment.redirectUrl || null : null,
      // QRIS only: what the QR page needs while the payment is still open
      qrString: payment.status === "PENDING" ? payment.qrString || null : null,
      // BCA virtual account and Indomaret: what the customer needs to pay
      vaNumber: payment.status === "PENDING" ? payment.vaNumber || null : null,
      paymentCode: payment.status === "PENDING" ? payment.paymentCode || null : null,
      sandbox: process.env.MIDTRANS_IS_PRODUCTION !== "true",
      expiresAt: payment.expiresAt || null,
      // Sandbox only: the QR image URL the Midtrans simulator asks for
      qrImageUrl:
        payment.status === "PENDING" && process.env.MIDTRANS_IS_PRODUCTION !== "true" ? payment.qrImageUrl || null : null,
      paymentMethod: checkout?.paymentMethod || null,
      items: checkout?.items?.map((i) => ({ name: i.name, price: i.price, qty: i.qty })) || [],
      subtotal: checkout?.subtotal ?? null,
      tax: checkout?.tax ?? null,
      total: checkout?.total ?? payment.amount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load payment" });
  }
}
