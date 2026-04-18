import { useEffect, useState } from "react";
import api from "../services/api";
import MetricCard from "./MetricCard";

const getShipmentTotal = (order) =>
  (order.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

const getItemCount = (order) =>
  (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

function AdminPanel() {
  const [analytics, setAnalytics] = useState({ totalOrders: 0, recycling: { totalWeight: 0, carbonSaved: 0 } });
  const [orders, setOrders] = useState([]);

  const loadData = async () => {
    const [analyticsRes, ordersRes] = await Promise.all([
      api.get("/admin/analytics"),
      api.get("/admin/orders")
    ]);
    setAnalytics(analyticsRes.data);
    setOrders(ordersRes.data.slice(0, 5));
  };

  useEffect(() => {
    loadData();
  }, []);

  const makePriority = async (id) => {
    await api.patch(`/admin/orders/${id}/priority`);
    loadData();
  };

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl text-slate-900">Admin Intelligence Dashboard</h2>
        <p className="text-sm text-slate-600">Monitor growth, operations, and carbon impact in one place.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Orders" value={analytics.totalOrders} subtitle="Across all categories" accent="bg-emerald-300" />
        <MetricCard title="Revenue" value={`INR ${Math.round(analytics.totalRevenue || 0)}`} subtitle="Gross merchandise value" accent="bg-yellow-300" />
        <MetricCard title="Carbon Saved" value={`${Number(analytics.recycling.carbonSaved || 0).toFixed(1)} kg`} subtitle={`Recycling requests: ${analytics.recycling.totalRequests || 0}`} accent="bg-lime-300" />
      </div>

      <div className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-lg text-slate-900">Recent Orders</h3>
        <div className="mt-3 space-y-2">
          {orders.map((order) => (
            <article key={order._id} className="rounded-xl border border-lime-200 bg-lime-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{order.items?.[0]?.name || "Mixed Order"}</p>
                  <p className="text-xs text-slate-600">Status: {order.status} | Priority: {order.priority ? "Yes" : "No"}</p>
                  <p className="text-xs text-slate-600">Address: {order.location?.address || "Campus"}</p>
                  <p className="text-xs text-slate-600">Items: {getItemCount(order)} | Payment: {order.paymentStatus || "Requested"}</p>
                  <p className="text-xs font-semibold text-slate-700">Shipment Value: INR {getShipmentTotal(order)}</p>
                </div>

                {!order.priority && (
                  <button className="rounded-full bg-lime-500 px-3 py-1 text-xs font-semibold text-white hover:bg-lime-600" onClick={() => makePriority(order._id)}>
                    Assign Priority
                  </button>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {(order.items || []).slice(0, 4).map((item, index) => (
                  <span key={`${order._id}-item-${index}`} className="rounded-full bg-white px-2 py-1 text-[11px] text-slate-600">
                    {item.name} x {item.quantity}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AdminPanel;
