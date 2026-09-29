// Usage: npm run seed   (requires MONGODB_URI in .env.local)
import mongoose from "mongoose";
import Product from "../models/Product.js";

const products = [
  { name: "Nasi Goreng Spesial", price: 25000, category: "Food", description: "Fried rice with egg and chicken", image: "https://placehold.co/400x300?text=Nasi+Goreng" },
  { name: "Mie Ayam", price: 20000, category: "Food", description: "Chicken noodles", image: "https://placehold.co/400x300?text=Mie+Ayam" },
  { name: "Sate Ayam", price: 27000, category: "Food", description: "10 skewers with peanut sauce", image: "https://placehold.co/400x300?text=Sate+Ayam" },
  { name: "Ayam Geprek", price: 22000, category: "Food", description: "Crispy chicken with sambal", image: "https://placehold.co/400x300?text=Ayam+Geprek" },
  { name: "Es Teh Manis", price: 6000, category: "Drink", description: "Sweet iced tea", image: "https://placehold.co/400x300?text=Es+Teh" },
  { name: "Kopi Susu", price: 18000, category: "Drink", description: "Iced milk coffee", image: "https://placehold.co/400x300?text=Kopi+Susu" },
  { name: "Jus Jeruk", price: 12000, category: "Drink", description: "Fresh orange juice", image: "https://placehold.co/400x300?text=Jus+Jeruk" },
  { name: "Air Mineral", price: 4000, category: "Drink", description: "600ml bottled water", image: "https://placehold.co/400x300?text=Air+Mineral" },
  { name: "Keripik Kentang", price: 10000, category: "Snack", description: "Potato chips", image: "https://placehold.co/400x300?text=Keripik" },
  { name: "Pisang Goreng", price: 12000, category: "Snack", description: "Fried banana", image: "https://placehold.co/400x300?text=Pisang+Goreng" },
  { name: "Cokelat Batang", price: 15000, category: "Snack", description: "Milk chocolate bar", image: "https://placehold.co/400x300?text=Cokelat" },
  { name: "Roti Bakar", price: 14000, category: "Snack", description: "Toast with chocolate and cheese", image: "https://placehold.co/400x300?text=Roti+Bakar" },
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(process.env.MONGODB_URI);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
