import { useState } from "react";
import api from "../services/api";
import { campusZones, timeSlots } from "../data/mockData";

function OrderPanel({ catalog = {}, onPlaced }) {
  const [category, setCategory] = useState("Food");
  const [itemId, setItemId] = useState("f1");
  const [slot, setSlot] = useState("ASAP");
  const [priority, setPriority] = useState(false);

  const selectedItems = catalog[category] || [];

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    const item = selectedItems.find((entry) => entry.id === itemId);
    const location = campusZones[Math.floor(Math.random() * campusZones.length)];

    const payload = {
      items: [{ name: item.name, category, price: item.price, quantity: 1 }],
      priority,
      preOrderSlot: slot,
      location: { lat: location.lat, lng: location.lng, address: location.label }
    };

    const response = await api.post("/orders", payload);
    onPlaced(response.data);
  };

  return (
    <form onSubmit={handlePlaceOrder} className="space-y-4 rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
      <h3 className="font-display text-lg text-slate-900">Smart Order and Pre-Order</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700">
          Category
          <select
            className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-slate-700"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              const first = catalog[event.target.value]?.[0]?.id || "";
              setItemId(first);
            }}
          >
            {Object.keys(catalog).map((key) => (
              <option key={key}>{key}</option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Item
          <select
            className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-slate-700"
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
          >
            {selectedItems.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Time Slot
          <select
            className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-slate-700"
            value={slot}
            onChange={(event) => setSlot(event.target.value)}
          >
            {timeSlots.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={priority} onChange={(event) => setPriority(event.target.checked)} />
          Priority delivery
        </label>
      </div>

      <button type="submit" className="rounded-full bg-lime-500 px-5 py-2 font-semibold text-white transition hover:bg-lime-600">
        Add to Cart & Place Order
      </button>
    </form>
  );
}

export default OrderPanel;
