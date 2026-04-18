import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import TrackingSteps from "../components/TrackingSteps";
import ListSkeleton from "../components/ListSkeleton";

function TrackingPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [ecoOptimized, setEcoOptimized] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrder = async () => {
    setLoading(true);
    const orderRes = await api.get(`/orders/${orderId}`);
    setOrder(orderRes.data);

    const taskRes = await api.get(`/tasks/by-order/${orderId}`);
    setEcoOptimized(Boolean(taskRes.data.ecoOptimized));

    const chatRes = await api.get(`/orders/${orderId}/chat`);
    setChatMessages(chatRes.data.messages || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    const timer = setInterval(() => {
      api.get(`/orders/${orderId}/chat`).then((res) => setChatMessages(res.data.messages || []));
    }, 5000);

    return () => clearInterval(timer);
  }, [orderId]);

  const moveStatus = async () => {
    await api.patch(`/orders/${orderId}/simulate-progress`);
    loadOrder();
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text) {
      return;
    }

    const response = await api.post(`/orders/${orderId}/chat`, { text });
    setChatMessages(response.data.messages || []);
    setChatInput("");
  };

  if (loading || !order) {
    return <ListSkeleton rows={3} />;
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Track Order</h1>
        <p className="text-sm text-slate-600">Order #{order._id.slice(-6)} | ETA {order.etaMinutes} mins</p>
        <p className="mt-1 text-xs text-slate-500">Address: {order.location?.address}</p>
        <p className="mt-1 text-xs text-slate-500">Delivery type: {order.deliveryType}</p>
        {order.deliveryType === "Scheduled" && (
          <p className="mt-1 text-xs text-slate-500">Scheduled at {order.scheduledDate} {order.scheduledTime}</p>
        )}
        {order.items?.some((item) => item.category === "Library") && (
          <p className="mt-1 text-xs text-slate-500">
            Return date: {
              order.items.find((item) => item.category === "Library")?.returnDate || "TBD"
            }
          </p>
        )}
      </div>

      {ecoOptimized && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Eco-optimized delivery assigned
        </p>
      )}

      <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
        <TrackingSteps status={order.status} />
        <button
          type="button"
          onClick={moveStatus}
          className="mt-4 rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Simulate live update
        </button>
      </div>

      <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Chat with delivery partner</h3>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-lime-50 p-3">
          {!chatMessages.length && <p className="text-xs text-slate-600">No messages yet.</p>}
          {chatMessages.map((entry, index) => (
            <article key={`${entry._id || index}`} className="rounded-lg bg-white p-2 text-xs text-slate-700">
              <p className="font-semibold">{entry.senderId?.name || entry.senderRole}</p>
              <p>{entry.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Type message"
          />
          <button
            type="button"
            onClick={sendChatMessage}
            className="rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

export default TrackingPage;
