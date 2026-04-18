import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import api from "../services/api";
import { resolveProductImage } from "../utils/productImages";

function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantity, updateBorrowDays, subtotal, deliveryFee, checkoutDraft, setCheckoutDraft } = useShop();
  const [walletPoints, setWalletPoints] = useState(0);

  useEffect(() => {
    api.get("/dashboard/wallet").then((response) => {
      setWalletPoints(response.data.points || 0);
    });
  }, []);

  const maxDiscount = Math.min(checkoutDraft.usePoints, subtotal, walletPoints);
  const total = Math.max(0, subtotal + deliveryFee - maxDiscount);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Cart</h1>
        <p className="text-sm text-slate-600">Review your items before checkout.</p>
      </div>

      <div className="space-y-3">
        {cart.map((item) => (
          <article key={item.id} className="flex items-center justify-between rounded-2xl border border-lime-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <img
                src={item.image || resolveProductImage(item.name, item.category)}
                alt={item.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = resolveProductImage(item.name, item.category);
                }}
                className="h-14 w-14 rounded-xl object-cover"
                loading="lazy"
              />

              <div>
              <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-500">INR {item.price}</p>
              {item.category === "Library" && (
                <label className="mt-2 block text-xs text-slate-600">
                  Borrow days
                  <input
                    type="number"
                    min="1"
                    value={item.borrowDays || 7}
                    onChange={(event) => updateBorrowDays(item.id, event.target.value)}
                    className="mt-1 w-28 rounded-lg border border-lime-200 bg-lime-50 px-2 py-1"
                  />
                </label>
              )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 rounded-full border border-lime-300">-</button>
              <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
              <button type="button" onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 rounded-full border border-lime-300">+</button>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Bill details</h3>
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <p>Subtotal: INR {subtotal}</p>
          <p>Delivery fee: INR {deliveryFee}</p>
          <p>Wallet points available: {walletPoints}</p>
          <p>Points discount: INR {maxDiscount}</p>
          <p className="font-bold text-slate-900">Total: INR {total}</p>
        </div>

        <label className="mt-3 block text-sm text-slate-700">
          Use points as discount
          <input
            type="number"
            min="0"
            value={checkoutDraft.usePoints}
            onChange={(event) =>
              setCheckoutDraft((prev) => ({
                ...prev,
                usePoints: Math.min(walletPoints, Math.max(0, Number(event.target.value || 0)))
              }))
            }
            className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
          />
        </label>

        <button
          type="button"
          disabled={!cart.length}
          onClick={() => navigate("/checkout")}
          className="mt-4 w-full rounded-full bg-lime-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Proceed to Checkout
        </button>
      </div>
    </section>
  );
}

export default CartPage;
