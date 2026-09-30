// Usage: npm run seed   (requires MONGODB_URI in .env.local)
import mongoose from "mongoose";
import Product from "../models/Product.js";

const products = [
  { name: "Nasi Goreng Spesial", price: 25000, category: "Food", description: "Fried rice with egg and chicken", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=200&fit=crop&q=70" },
  { name: "Mie Ayam", price: 20000, category: "Food", description: "Chicken noodles", image: "https://images.unsplash.com/photo-1644083152667-2c78739e882a?w=200&h=200&fit=crop&q=70" },
  { name: "Sate Ayam", price: 27000, category: "Food", description: "10 skewers with peanut sauce", image: "https://images.unsplash.com/photo-1772855386828-a18ff9a12584?w=200&h=200&fit=crop&q=70" },
  { name: "Ayam Geprek", price: 22000, category: "Food", description: "Crispy chicken with sambal", image: "https://images.unsplash.com/photo-1569058242252-623df46b5025?w=200&h=200&fit=crop&q=70" },
  { name: "Es Teh Manis", price: 6000, category: "Drink", description: "Sweet iced tea", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop&q=70" },
  { name: "Kopi Susu", price: 18000, category: "Drink", description: "Iced milk coffee", image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=200&h=200&fit=crop&q=70" },
  { name: "Jus Jeruk", price: 12000, category: "Drink", description: "Fresh orange juice", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=200&h=200&fit=crop&q=70" },
  { name: "Air Mineral", price: 4000, category: "Drink", description: "600ml bottled water", image: "/images/air-mineral.png" },
  { name: "Keripik Kentang", price: 10000, category: "Snack", description: "Potato chips", image: "https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=200&h=200&fit=crop&q=70" },
  { name: "Pisang Goreng", price: 12000, category: "Snack", description: "Fried banana", image: "https://images.unsplash.com/photo-1658373072934-d96e583a44f4?w=200&h=200&fit=crop&q=70" },
  { name: "Cokelat Batang", price: 15000, category: "Snack", description: "Milk chocolate bar", image: "https://images.unsplash.com/photo-1623660053975-cf75a8be0908?w=200&h=200&fit=crop&q=70" },
  { name: "Roti Bakar", price: 14000, category: "Snack", description: "Toast with chocolate spread", image: "https://images.unsplash.com/photo-1693835791992-ae0c42f7074d?w=200&h=200&fit=crop&q=70" },
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
