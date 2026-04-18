import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { instamartDataset } from "../data/instamartDataset";

const ShopContext = createContext(null);

const safeParse = (rawValue, fallback) => {
  try {
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
    return fallback;
  }
};

const initialCheckout = {
  block: "",
  room: "",
  customAddress: "",
  deliveryType: "Instant",
  scheduledDate: "",
  scheduledTime: "",
  slot: "ASAP",
  priority: false,
  paymentMethod: "UPI",
  usePoints: 0
};

export function ShopProvider({ children }) {
  const [catalog, setCatalog] = useState(instamartDataset);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [cart, setCart] = useState(() => safeParse(localStorage.getItem("cx_cart"), []));
  const [checkoutDraft, setCheckoutDraft] = useState(() =>
    safeParse(localStorage.getItem("cx_checkout_draft"), initialCheckout)
  );

  useEffect(() => {
    localStorage.setItem("cx_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("cx_checkout_draft", JSON.stringify(checkoutDraft));
  }, [checkoutDraft]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await api.get("/orders/catalog");
        setCatalog(response.data);
      } catch (error) {
        setCatalog(instamartDataset);
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
  }, []);

  const allItems = useMemo(
    () => Object.values(catalog).flatMap((items) => items || []),
    [catalog]
  );

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [
        ...prev,
        {
          ...item,
          quantity: 1,
          borrowDays: item.category === "Library" ? 7 : 0
        }
      ];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const updateBorrowDays = (id, days) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, borrowDays: item.category === "Library" ? Math.max(1, Number(days || 1)) : 0 }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const deliveryFee = subtotal > 399 ? 0 : 25;

  const value = useMemo(
    () => ({
      catalog,
      catalogLoading,
      allItems,
      cart,
      addToCart,
      updateQuantity,
      updateBorrowDays,
      clearCart,
      subtotal,
      deliveryFee,
      checkoutDraft,
      setCheckoutDraft
    }),
    [catalog, catalogLoading, allItems, cart, subtotal, deliveryFee, checkoutDraft]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  return useContext(ShopContext);
}
