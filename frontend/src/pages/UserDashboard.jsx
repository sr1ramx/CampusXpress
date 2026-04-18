import { useEffect, useMemo, useState } from "react";
import MetricCard from "../components/MetricCard";
import RecyclingPanel from "../components/RecyclingPanel";
import LibraryPanel from "../components/LibraryPanel";
import api from "../services/api";
import { campusZones, timeSlots } from "../data/mockData";

const shippingStates = [
  "Payment Requested",
  "Paid",
  "Preparing",
  "Out for delivery",
  "Delivered"
];

const getShippingStep = (order) => {
  if (!order) return 0;
  if (order.status === "Delivered") return 4;
  if (order.status === "Out for delivery") return 3;
  if (order.status === "Preparing") {
    return order.paymentStatus === "Paid" ? 2 : 0;
  }
  return 0;
};

const flattenCatalog = (catalog) =>
  Object.entries(catalog).flatMap(([category, products]) =>
    (products || []).map((product) => ({ ...product, category }))
  );

function UserDashboard() {
  const [catalog, setCatalog] = useState({ Food: [], Stationery: [], Library: [] });
  const [dashboard, setDashboard] = useState({ points: 0, totalRecycled: 0, carbonSaved: 0, ecoScore: 0 });
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [checkout, setCheckout] = useState({
    block: campusZones[0].label,
    room: "",
    slot: "ASAP",
    priority: false,
    paymentMethod: "UPI"
  });
  const [placing, setPlacing] = useState(false);

  const refreshDashboard = async () => {
    const [dashboardRes, ordersRes] = await Promise.all([
      api.get("/dashboard/me"),
      api.get("/orders/mine")
    ]);

    setDashboard(dashboardRes.data);
    setOrders(ordersRes.data);
  };

  useEffect(() => {
    api.get("/orders/catalog").then((res) => setCatalog(res.data));
    refreshDashboard();
  }, []);

  const latest = useMemo(() => orders[0], [orders]);
  const allProducts = useMemo(() => flattenCatalog(catalog), [catalog]);
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const placeOrderWithPaymentRequest = async () => {
    if (!cart.length) {
      return;
    }

    const zone = campusZones.find((entry) => entry.label === checkout.block) || campusZones[0];
    setPlacing(true);

    try {
      await api.post("/orders", {
        items: cart.map((item) => ({
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity
        })),
        priority: checkout.priority,
        preOrderSlot: checkout.slot,
        paymentMethod: checkout.paymentMethod,
        location: {
          lat: zone.lat,
          lng: zone.lng,
          block: checkout.block,
          room: checkout.room,
          address: `${checkout.block}${checkout.room ? ` - ${checkout.room}` : ""}`
        }
      });
      setCart([]);
      await refreshDashboard();
    } finally {
      setPlacing(false);
    }
  };

  const confirmPayment = async () => {
    if (!latest || latest.paymentStatus === "Paid") {
      return;
    }
    await api.patch(`/orders/${latest._id}/payment-confirm`);
    await refreshDashboard();
  };

  const redeem = async () => {
    await api.post("/dashboard/redeem", { points: 200 });
    refreshDashboard();
  };

  const shippingStep = getShippingStep(latest);

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-600">Campus Quick Commerce</p>
        <h2 className="mt-1 font-display text-2xl text-slate-900">Campus Blinkit Experience</h2>
        <p className="text-sm text-slate-600">Shop in minutes, request payment, and track shipping status with eco rewards.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Points Wallet" value={dashboard.points} subtitle="Earn from orders + recycling" accent="bg-emerald-300" />
        <MetricCard title="Total Recycled" value={`${dashboard.totalRecycled} kg`} subtitle="Material recovered" accent="bg-teal-300" />
        <MetricCard title="Carbon Saved" value={`${dashboard.carbonSaved} kg`} subtitle="Estimated impact" accent="bg-lime-300" />
        <MetricCard title="Eco Score" value={dashboard.ecoScore} subtitle="Campus sustainability rank" accent="bg-green-300" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg text-slate-900">Shop Essentials</h3>
            <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-700">
              {allProducts.length} items
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {allProducts.map((product) => (
              <article key={product.id} className="rounded-2xl border border-lime-200 bg-lime-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">{product.category}</p>
                <h4 className="mt-1 font-semibold text-slate-900">{product.name}</h4>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-bold text-slate-900">INR {product.price}</p>
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="rounded-full bg-lime-500 px-3 py-1 text-xs font-semibold text-white hover:bg-lime-600"
                  >
                    Add
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg text-slate-900">Cart and Checkout</h3>
          <div className="mt-4 space-y-3">
            {cart.length === 0 && (
              <p className="rounded-xl bg-lime-50 p-3 text-sm text-slate-600">Your cart is empty.</p>
            )}
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-lime-200 bg-lime-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-600">INR {item.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="h-7 w-7 rounded-full border border-lime-300 bg-white" onClick={() => updateCartQty(item.id, -1)}>-</button>
                  <span className="text-sm font-semibold">{item.quantity}</span>
                  <button type="button" className="h-7 w-7 rounded-full border border-lime-300 bg-white" onClick={() => updateCartQty(item.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            <label className="text-sm text-slate-700">
              Block Address
              <select
                className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                value={checkout.block}
                onChange={(event) => setCheckout((prev) => ({ ...prev, block: event.target.value }))}
              >
                {campusZones.map((zone) => (
                  <option key={zone.label} value={zone.label}>{zone.label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-700">
              Room / Landmark
              <input
                className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                value={checkout.room}
                onChange={(event) => setCheckout((prev) => ({ ...prev, room: event.target.value }))}
                placeholder="Ex: Block C, Room 204"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-700">
                Delivery Slot
                <select
                  className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                  value={checkout.slot}
                  onChange={(event) => setCheckout((prev) => ({ ...prev, slot: event.target.value }))}
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-700">
                Payment Method
                <select
                  className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                  value={checkout.paymentMethod}
                  onChange={(event) => setCheckout((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={checkout.priority}
                onChange={(event) => setCheckout((prev) => ({ ...prev, priority: event.target.checked }))}
              />
              Priority delivery
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-lime-200 bg-lime-50 p-4">
            <p className="text-sm text-slate-600">Subtotal</p>
            <p className="text-2xl font-bold text-slate-900">INR {subtotal}</p>
            <button
              type="button"
              disabled={!cart.length || placing}
              onClick={placeOrderWithPaymentRequest}
              className="mt-3 w-full rounded-full bg-lime-500 px-4 py-2 font-semibold text-white hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placing ? "Requesting..." : "Request Payment and Place Order"}
            </button>
          </div>
        </section>
      </div>

      <RecyclingPanel onCreated={refreshDashboard} />

      <LibraryPanel />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg text-slate-900">Order to Shipping Journey</h3>
          <p className="mb-3 text-sm text-slate-600">
            {latest
              ? `Latest order: ${latest.location?.address || "Campus"} | Payment: ${latest.paymentStatus}`
              : "Place an order to start your shipping timeline."}
          </p>
          <div className="space-y-2">
            {shippingStates.map((state, index) => (
              <div key={state} className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${
                    shippingStep >= index ? "bg-lime-500" : "bg-slate-300"
                  }`}
                />
                <p className={`text-sm ${shippingStep >= index ? "text-slate-900" : "text-slate-500"}`}>{state}</p>
              </div>
            ))}
          </div>

          {latest && latest.paymentStatus !== "Paid" && (
            <button
              type="button"
              onClick={confirmPayment}
              className="mt-4 rounded-full bg-lime-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-600"
            >
              Confirm Payment
            </button>
          )}

          <div className="mt-4 rounded-xl bg-lime-50 p-3 text-sm text-slate-700">
            ETA: {latest?.etaMinutes || 0} mins {latest?.priority ? "| Priority" : ""}
          </div>
        </section>

        <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg text-slate-900">Eco Reward Redemption</h3>
          <p className="mt-2 text-sm text-slate-600">Redeem 200 points to unlock a 2.00 discount on your next order.</p>
          <button className="mt-4 rounded-full bg-lime-500 px-5 py-2 font-semibold text-white hover:bg-lime-600" onClick={redeem}>
            Redeem 200 Points
          </button>
        </section>
      </div>
    </section>
  );
}

export default UserDashboard;
