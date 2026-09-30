import mongoose from "mongoose";

const CheckoutItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const CheckoutSchema = new mongoose.Schema(
  {
    items: { type: [CheckoutItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    // Optional: only used for a receipt
    customer: {
      email: { type: String, default: "" },
    },
    // "other" is kept only so orders created before it was removed still load
    paymentMethod: { type: String, enum: ["card", "qris", "bca_va", "indomaret", "other"], default: "card" },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
  },
  { timestamps: true }
);

// In dev, hot reload keeps the old compiled model alive; drop it so schema edits apply
if (process.env.NODE_ENV !== "production") delete mongoose.models.Checkout;

export default mongoose.models.Checkout || mongoose.model("Checkout", CheckoutSchema);
