import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const CART_KEY = "cart";
const DETAILS_KEY = "checkout-details";

const emptyDetails = { name: "", phone: "", email: "", address: "", method: "card" };

export function CartProvider({ children }) {
  // items: { [productId]: { productId, name, price, image, qty } }
  const [items, setItems] = useState({});
  // shipping + payment choice, kept so going back from payment does not lose the form
  const [details, setDetails] = useState(emptyDetails);
  const [loaded, setLoaded] = useState(false);

  // Load saved state after mount (localStorage is not available during SSR)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedCart) setItems(JSON.parse(savedCart));
      const savedDetails = localStorage.getItem(DETAILS_KEY);
      if (savedDetails) setDetails({ ...emptyDetails, ...JSON.parse(savedDetails) });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem(DETAILS_KEY, JSON.stringify(details));
  }, [details, loaded]);

  const addItem = (product) =>
    setItems((prev) => {
      const id = product._id;
      const existing = prev[id];
      return {
        ...prev,
        [id]: {
          productId: id,
          name: product.name,
          price: product.price,
          image: product.image,
          qty: existing ? existing.qty + 1 : 1,
        },
      };
    });

  const increaseItem = (id) =>
    setItems((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], qty: prev[id].qty + 1 } } : prev));

  const decreaseItem = (id) =>
    setItems((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      const next = { ...prev };
      if (existing.qty <= 1) delete next[id];
      else next[id] = { ...existing, qty: existing.qty - 1 };
      return next;
    });

  const removeItem = (id) =>
    setItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const clearCart = () => setItems({});

  const updateDetails = (patch) => setDetails((prev) => ({ ...prev, ...patch }));

  const list = Object.values(items);
  const totalQty = list.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = list.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        list,
        totalQty,
        totalPrice,
        loaded,
        details,
        updateDetails,
        addItem,
        increaseItem,
        decreaseItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
