import PartnerPanel from "../components/PartnerPanel";

function DeliveryPage() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Delivery Partner Panel</h1>
        <p className="text-sm text-slate-600">Accept and complete combined delivery plus recycling tasks.</p>
      </div>
      <PartnerPanel />
    </section>
  );
}

export default DeliveryPage;
