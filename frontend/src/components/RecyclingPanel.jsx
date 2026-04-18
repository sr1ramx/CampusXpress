import { useState } from "react";
import api from "../services/api";
import { campusZones } from "../data/mockData";

function RecyclingPanel({ onCreated }) {
  const [material, setMaterial] = useState("plastic");
  const [weight, setWeight] = useState(2);
  const [scheduledAt, setScheduledAt] = useState("Today 6 PM");

  const submitRecycling = async (event) => {
    event.preventDefault();
    const location = campusZones[Math.floor(Math.random() * campusZones.length)];
    const payload = {
      material,
      weight: Number(weight),
      scheduledAt,
      location: { lat: location.lat, lng: location.lng, address: location.label }
    };

    const response = await api.post("/recycling", payload);
    onCreated(response.data);
  };

  return (
    <form onSubmit={submitRecycling} className="space-y-4 rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
      <h3 className="font-display text-lg text-slate-900">Recycling Pickup Request</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="text-sm text-slate-700">
          Material
          <select className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={material} onChange={(event) => setMaterial(event.target.value)}>
            <option value="plastic">Plastic</option>
            <option value="paper">Paper</option>
            <option value="metal">Metal</option>
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Weight (kg)
          <input className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" type="number" min="1" value={weight} onChange={(event) => setWeight(event.target.value)} />
        </label>

        <label className="text-sm text-slate-700">
          Pickup Slot
          <input className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
        </label>
      </div>
      <button type="submit" className="rounded-full bg-lime-500 px-5 py-2 font-semibold text-white transition hover:bg-lime-600">
        Schedule Pickup
      </button>
    </form>
  );
}

export default RecyclingPanel;
