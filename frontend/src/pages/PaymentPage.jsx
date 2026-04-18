import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useShop } from "../context/ShopContext";

function PaymentPage() {
  const navigate = useNavigate();
  const { cart, subtotal, deliveryFee, checkoutDraft, clearCart } = useShop();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [walletPoints, setWalletPoints] = useState(0);

  useEffect(() => {
    api.get("/dashboard/wallet").then((res) => setWalletPoints(res.data.points || 0));
  }, []);

  const appliedPoints = Math.min(checkoutDraft.usePoints, walletPoints, subtotal);
  const total = Math.max(0, subtotal + deliveryFee - appliedPoints);

  const handlePay = async () => {
    if (!cart.length || loading) {
      return;
    }

    setLoading(true);
    setError("");
    const hubLat = 12.9716;
    const hubLng = 77.5946;

    try {
      const createOrder = await api.post("/orders", {
        items: cart.map((item) => ({
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          borrowDays: item.category === "Library" ? Math.max(1, Number(item.borrowDays || 7)) : 0,
          returnDate:
            item.category === "Library"
              ? new Date(Date.now() + Math.max(1, Number(item.borrowDays || 7)) * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB")
              : ""
        })),
        priority: checkoutDraft.priority,
        deliveryType: checkoutDraft.deliveryType,
        scheduledDate: checkoutDraft.deliveryType === "Scheduled" ? checkoutDraft.scheduledDate : "",
        scheduledTime: checkoutDraft.deliveryType === "Scheduled" ? checkoutDraft.scheduledTime : "",
        preOrderSlot: checkoutDraft.slot,
        paymentMethod: checkoutDraft.paymentMethod,
        location: {
          lat: hubLat,
          lng: hubLng,
          block: checkoutDraft.block || "Campus",
          room: checkoutDraft.room,
          address:
            checkoutDraft.customAddress ||
            `${checkoutDraft.block || "Campus"}${checkoutDraft.room ? ` - ${checkoutDraft.room}` : ""}`
        }
      });

      if (appliedPoints > 0) {
        await api.post("/dashboard/redeem", { points: appliedPoints });
      }

      await api.patch(`/orders/${createOrder.data._id}/payment-confirm`);
      setSuccess(true);
      clearCart();

      setTimeout(() => {
        navigate(`/tracking/${createOrder.data._id}`);
      }, 1000);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Payment</h1>
        <p className="text-sm text-slate-600">Choose method and complete order.</p>
      </div>

      <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Payment summary</h3>
        <p className="mt-2 text-sm text-slate-600">Method: {checkoutDraft.paymentMethod}</p>
        <p className="text-sm text-slate-600">Amount: INR {total}</p>

        <button
          type="button"
          onClick={handlePay}
          disabled={loading || !cart.length}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-lime-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
          {loading ? "Processing payment..." : success ? "Payment Successful" : "Pay Now"}
        </button>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
    </section>
  );
}

export default PaymentPage;
