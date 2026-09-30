import "@/styles/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { CartProvider } from "@/context/CartContext";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <div className={`${jakarta.className} min-h-screen`}>
        <Component {...pageProps} />
      </div>
    </CartProvider>
  );
}
