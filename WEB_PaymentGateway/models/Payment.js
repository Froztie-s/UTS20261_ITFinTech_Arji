import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    checkoutId: { type: mongoose.Schema.Types.ObjectId, ref: "Checkout", required: true },
    orderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    snapToken: { type: String, default: "" },
    redirectUrl: { type: String, default: "" },
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

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
