import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();
    const { category } = req.query;
    const filter = category && category !== "All" ? { category } : {};
    const products = await Product.find(filter).sort({ category: 1, name: 1 }).lean();
    return res.status(200).json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}
