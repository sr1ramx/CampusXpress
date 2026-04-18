import AdminPanel from "../components/AdminPanel";

function AdminPage() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Admin Console</h1>
        <p className="text-sm text-slate-600">Orders, users, revenue, recycling analytics.</p>
      </div>
      <AdminPanel />
    </section>
  );
}

export default AdminPage;
