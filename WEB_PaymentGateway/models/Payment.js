import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    checkoutId: { type: mongoose.Schema.Types.ObjectId, ref: "Checkout", required: true },
    orderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    snapToken: { type: String, default: "" },
    redirectUrl: { type: String, default: "" },
    // QRIS (Core API): raw QR data to render, and when it stops being valid
    qrString: { type: String, default: "" },
    qrImageUrl: { type: String, default: "" }, // Midtrans-hosted QR image (used by the sandbox simulator)
    expiresAt: { type: Date },
    status: {
      type: String,
      enum: ["PENDING", "LUNAS", "EXPIRED", "FAILED"],
      default: "PENDING",
    },
    paidAt: { type: Date },
    rawNotification: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// In dev, hot reload keeps the old compiled model (and its old fields) alive; drop it so schema edits apply
if (process.env.NODE_ENV !== "production") delete mongoose.models.Payment;

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
