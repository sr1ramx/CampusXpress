import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ListSkeleton from "../components/ListSkeleton";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/mine")
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">My Orders</h1>
        <p className="text-sm text-slate-600">View all your campus orders.</p>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : (
        <div className="space-y-3">
        {orders.map((order) => (
          <article key={order._id} className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Order #{order._id.slice(-6)}</p>
              <span className="rounded-full bg-lime-100 px-2 py-1 text-xs font-semibold text-lime-700">{order.status}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{order.location?.address}</p>
            <p className="mt-1 text-xs text-slate-500">{order.deliveryType} delivery</p>
            {order.deliveryType === "Scheduled" && (
              <p className="mt-1 text-xs text-slate-500">Scheduled: {order.scheduledDate} {order.scheduledTime}</p>
            )}
            <p className="mt-2 text-xs text-slate-600">Payment: {order.paymentStatus} | ETA {order.etaMinutes} mins</p>
            {order.items?.some((item) => item.category === "Library") && (
              <div className="mt-2 rounded-lg bg-lime-50 p-2 text-xs text-slate-700">
                {order.items
                  .filter((item) => item.category === "Library")
                  .map((item, index) => (
                    <p key={`${item.name}-${index}`}>
                      {item.name}: {item.borrowDays} days, return by {item.returnDate || "TBD"}
                    </p>
                  ))}
              </div>
            )}
            <Link to={`/tracking/${order._id}`} className="mt-3 inline-block rounded-full bg-lime-600 px-3 py-1 text-xs font-semibold text-white">
              Track order
            </Link>
          </article>
        ))}
        </div>
      )}
    </section>
  );
}

export default OrdersPage;
