import { useMemo, useState } from "react";
import api from "../services/api";
import { campusZones } from "../data/mockData";

const pointsPerKg = { plastic: 6, paper: 4, metal: 5 };
const carbonFactor = { plastic: 2.5, paper: 1.5, metal: 3.0 };
const sizePointsMap = {
  plastic: ["250ml", "500ml", "1L"],
  paper: ["sheets", "kg"],
  metal: ["can", "heavy"]
};

function RecyclePage() {
  const [material, setMaterial] = useState("plastic");
  const [itemType, setItemType] = useState("Bottle");
  const [quantity, setQuantity] = useState(1);
  const [sizeType, setSizeType] = useState("250ml");
  const [weight, setWeight] = useState(1);
  const [message, setMessage] = useState("");

  const livePoints = useMemo(() => {
    const w = Number(weight || 0);
    const q = Number(quantity || 0);
    if (material === "plastic") {
      if (sizeType === "250ml") return q;
      if (sizeType === "500ml") return q * 2;
      if (sizeType === "1L") return q * 4;
    }
    if (material === "paper") {
      if (sizeType === "sheets") return q;
      if (sizeType === "kg") return q * 4;
    }
    if (material === "metal") {
      if (sizeType === "can") return q * 2;
      if (sizeType === "heavy") return q * 5;
    }
    return Math.round((pointsPerKg[material] || 0) * w);
  }, [material, quantity, sizeType, weight]);

  const liveCarbon = useMemo(() => Number(((carbonFactor[material] || 0) * Number(weight || 0)).toFixed(2)), [material, weight]);

  const submit = async (event) => {
    event.preventDefault();
    const zone = campusZones[Math.floor(Math.random() * campusZones.length)];
    const response = await api.post("/recycling", {
      material,
      itemType,
      quantity: Number(quantity),
      sizeType,
      weight: Number(weight),
      scheduledAt: "Today",
      location: { lat: zone.lat, lng: zone.lng, address: zone.label }
    });

    setMessage(`+${response.data.earnedPoints} points added!`);
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Recycle Pickup</h1>
        <p className="text-sm text-slate-600">Convert waste into rewards with instant campus pickup.</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Material
            <select className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={material} onChange={(event) => {
              const nextMaterial = event.target.value;
              setMaterial(nextMaterial);
              setSizeType(sizePointsMap[nextMaterial][0]);
            }}>
              <option value="plastic">Plastic</option>
              <option value="paper">Paper</option>
              <option value="metal">Metal</option>
            </select>
          </label>

          <label className="text-sm text-slate-700">
            Item type
            <input type="text" className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={itemType} onChange={(event) => setItemType(event.target.value)} placeholder="Bottle / Newspaper / Can" />
          </label>

          <label className="text-sm text-slate-700">
            Quantity
            <input type="number" min="1" className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>

          <label className="text-sm text-slate-700">
            Size type
            <select className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={sizeType} onChange={(event) => setSizeType(event.target.value)}>
              {sizePointsMap[material].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-700">
            Estimated weight (kg)
            <input type="number" min="1" className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={weight} onChange={(event) => setWeight(event.target.value)} />
          </label>
        </div>

        <div className="mt-3 space-y-2 rounded-xl bg-lime-50 p-3 text-sm">
          <p>You earn: {livePoints} points</p>
          <p>Carbon saved: {liveCarbon} kg CO2</p>
        </div>

        <button type="submit" className="mt-4 rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white">Submit Pickup Request</button>
      </form>

      {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
    </section>
  );
}

export default RecyclePage;
