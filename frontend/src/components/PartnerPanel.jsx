import { useEffect, useState } from "react";
import api from "../services/api";

const getShipmentValue = (order) =>
  (order?.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

function PartnerPanel() {
  const [tasks, setTasks] = useState([]);
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const loadTasks = () => {
    api.get("/tasks/partner").then((res) => setTasks(res.data));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!activeChatOrder) {
      return undefined;
    }

    const timer = setInterval(() => {
      api.get(`/orders/${activeChatOrder._id}/chat`).then((res) => setChatMessages(res.data.messages || []));
    }, 5000);

    return () => clearInterval(timer);
  }, [activeChatOrder]);

  const acceptTask = async (id) => {
    await api.post(`/tasks/${id}/accept`);
    loadTasks();
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/tasks/${id}/status`, { status });
    loadTasks();
  };

  const openChat = async (order) => {
    const response = await api.get(`/orders/${order._id}/chat`);
    setActiveChatOrder(order);
    setChatMessages(response.data.messages || []);
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!activeChatOrder || !text) {
      return;
    }

    const response = await api.post(`/orders/${activeChatOrder._id}/chat`, { text });
    setChatMessages(response.data.messages || []);
    setChatInput("");
  };

  return (
    <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl text-slate-900">Delivery Partner Console</h2>
      <p className="mt-1 text-sm text-slate-600">Combined tasks include delivery + recycling when nearby.</p>
      <div className="mt-5 space-y-3">
        {tasks.map((task) => (
          <article key={task._id} className="rounded-2xl border border-lime-200 bg-lime-50 p-4">
            <p className="text-sm text-slate-700">Task: {task.orderId ? "Delivery" : ""} {task.recyclingId ? "+ Recycling" : ""}</p>
            <p className="text-xs text-lime-700">Status: {task.status}</p>
            {task.orderId && task.recyclingId && (
              <p className="mt-1 text-xs font-semibold text-emerald-700">Eco-optimized combined route</p>
            )}

            {task.orderId && (
              <div className="mt-2 rounded-xl bg-white p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Delivery Details</p>
                <p>Address: {task.orderId.location?.address || "Campus"}</p>
                <p>Shipment Value: INR {getShipmentValue(task.orderId)}</p>
                <p>Payment: {task.orderId.paymentStatus || "Requested"}</p>
                <p>Items: {(task.orderId.items || []).map((item) => `${item.name} x${item.quantity}`).join(", ")}</p>
              </div>
            )}

            {task.recyclingId && (
              <div className="mt-2 rounded-xl bg-white p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Recycling Details</p>
                <p>Material: {task.recyclingId.material}</p>
                <p>Weight: {task.recyclingId.weight} kg</p>
                <p>Carbon Saved: {task.recyclingId.carbonSaved} kg</p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-full bg-lime-500 px-3 py-1 text-xs font-semibold text-white hover:bg-lime-600" onClick={() => acceptTask(task._id)}>Accept</button>
              <button className="rounded-full border border-lime-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-lime-100" onClick={() => updateStatus(task._id, "In Transit")}>In Transit</button>
              <button className="rounded-full border border-lime-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-lime-100" onClick={() => updateStatus(task._id, "Completed")}>Completed</button>
              {task.orderId && (
                <button className="rounded-full border border-lime-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-lime-100" onClick={() => openChat(task.orderId)}>Chat</button>
              )}
            </div>
          </article>
        ))}
      </div>

      {activeChatOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-900">Chat for order #{activeChatOrder._id.slice(-6)}</h3>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl bg-lime-50 p-3">
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
              <button type="button" onClick={sendChatMessage} className="rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white">Send</button>
              <button type="button" onClick={() => setActiveChatOrder(null)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default PartnerPanel;
