import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Checkout from "@/models/Checkout";
import { calcTax } from "@/lib/pricing";

const METHODS = ["card", "qris", "other"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { items, email = "", method = "card" } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  if (!METHODS.includes(method)) {
    return res.status(400).json({ error: "Invalid payment method" });
  }
  const cleanEmail = String(email).trim();
  if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  // Merge duplicate lines and validate quantities
  const wanted = new Map();
  for (const line of items) {
    const qty = Number(line?.qty);
    if (!mongoose.isValidObjectId(line?.productId) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return res.status(400).json({ error: "Invalid item in cart" });
    }
    wanted.set(line.productId, (wanted.get(line.productId) || 0) + qty);
  }

  try {
    await dbConnect();

    // Prices always come from the database, never from the client
    const products = await Product.find({ _id: { $in: [...wanted.keys()] } }).lean();
    if (products.length !== wanted.size) {
      return res.status(400).json({ error: "Some items are no longer available" });
    }

    const lines = products.map((p) => ({
      productId: p._id,
      name: p.name,
      price: p.price,
      qty: wanted.get(String(p._id)),
    }));

    const outOfStock = products.find((p) => wanted.get(String(p._id)) > p.stock);
    if (outOfStock) {
      return res.status(400).json({ error: `Not enough stock for ${outOfStock.name}` });
    }

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const tax = calcTax(subtotal);
    const total = subtotal + tax;

    const checkout = await Checkout.create({
      items: lines,
      subtotal,
      tax,
      total,
      customer: { email: cleanEmail },
      paymentMethod: method,
    });

    return res.status(201).json({
      checkoutId: checkout._id,
      items: lines,
      subtotal,
      tax,
      total,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create checkout" });
  }
}
