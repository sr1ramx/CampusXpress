import { useNavigate } from "react-router-dom";
import { timeSlots } from "../data/mockData";
import { useShop } from "../context/ShopContext";

function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, subtotal, deliveryFee, checkoutDraft, setCheckoutDraft } = useShop();
  const pointsApplied = Math.min(checkoutDraft.usePoints, subtotal);
  const payable = Math.max(0, subtotal + deliveryFee - pointsApplied);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Checkout</h1>
        <p className="text-sm text-slate-600">Address, slot, and delivery preferences.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <label className="block text-sm text-slate-700">
              Block / Hostel
              <input
                className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                value={checkoutDraft.block}
                onChange={(event) => setCheckoutDraft((prev) => ({ ...prev, block: event.target.value }))}
                placeholder="Enter block or hostel"
              />
            </label>

            <label className="block text-sm text-slate-700">
              Room / Landmark
              <input
                className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                value={checkoutDraft.room}
                onChange={(event) => setCheckoutDraft((prev) => ({ ...prev, room: event.target.value }))}
                placeholder="Ex: Hostel A, Room 306"
              />
            </label>

            <label className="block text-sm text-slate-700">
              Custom delivery address
              <input
                className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                value={checkoutDraft.customAddress}
                onChange={(event) => setCheckoutDraft((prev) => ({ ...prev, customAddress: event.target.value }))}
                placeholder="Optional detailed address"
              />
            </label>

            <label className="block text-sm text-slate-700">
              Delivery type
              <select
                className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                value={checkoutDraft.deliveryType}
                onChange={(event) => setCheckoutDraft((prev) => ({ ...prev, deliveryType: event.target.value }))}
              >
                <option value="Instant">Instant</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </label>

            {checkoutDraft.deliveryType === "Scheduled" && (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  Scheduled date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                    value={checkoutDraft.scheduledDate}
                    onChange={(event) => setCheckoutDraft((prev) => ({ ...prev, scheduledDate: event.target.value }))}
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  Scheduled time
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                    value={checkoutDraft.scheduledTime}
                    onChange={(event) => setCheckoutDraft((prev) => ({ ...prev, scheduledTime: event.target.value }))}
                  />
                </label>
              </div>
            )}

            <label className="block text-sm text-slate-700">
              Time slot
              <select
                className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                value={checkoutDraft.slot}
                onChange={(event) => setCheckoutDraft((prev) => ({ ...prev, slot: event.target.value }))}
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-700">
              Payment Method
              <select
                className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
                value={checkoutDraft.paymentMethod}
                onChange={(event) => setCheckoutDraft((prev) => ({ ...prev, paymentMethod: event.target.value }))}
              >
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Wallet">Wallet</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={checkoutDraft.priority}
                onChange={(event) => setCheckoutDraft((prev) => ({ ...prev, priority: event.target.checked }))}
              />
              Priority delivery
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold">Order Summary</h3>
          <div className="mt-2 text-sm text-slate-600">
            <p>Items: {cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
            <p>Subtotal: INR {subtotal}</p>
            <p>Delivery fee: INR {deliveryFee}</p>
            <p>Points discount: INR {pointsApplied}</p>
            <p>Delivery mode: {checkoutDraft.deliveryType}</p>
            {checkoutDraft.deliveryType === "Scheduled" && (
              <p>Schedule: {checkoutDraft.scheduledDate || "Date pending"} {checkoutDraft.scheduledTime || "Time pending"}</p>
            )}
            <p className="mt-2 font-bold text-slate-900">Payable: INR {payable}</p>
          </div>

          <p className="mt-4 rounded-xl bg-lime-50 p-3 text-sm text-slate-700">
            ETA estimate shown at tracking: Distance x 2 + Active Orders x 5
          </p>

          <button
            type="button"
            disabled={!cart.length}
            onClick={() => navigate("/payment")}
            className="mt-4 w-full rounded-full bg-lime-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </section>
  );
}

export default CheckoutPage;
