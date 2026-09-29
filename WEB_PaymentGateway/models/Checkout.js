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
    total: { type: Number, required: true, min: 0 },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
    },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Checkout || mongoose.model("Checkout", CheckoutSchema);
