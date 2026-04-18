import { useEffect, useState } from "react";
import api from "../services/api";
import ListSkeleton from "../components/ListSkeleton";

function WalletPage() {
  const [wallet, setWallet] = useState({ points: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/wallet")
      .then((res) => setWallet(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">Wallet</h1>
        <p className="text-sm text-slate-600">Total points: {wallet.points}</p>
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold">Transaction History</h3>
          <div className="mt-3 space-y-2">
            {wallet.transactions.map((entry, index) => (
              <div key={`${entry.createdAt}-${index}`} className="flex items-center justify-between rounded-xl bg-lime-50 p-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{entry.note || entry.type}</p>
                  <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <span className={entry.type === "earn" ? "text-emerald-600" : "text-rose-600"}>
                  {entry.type === "earn" ? "+" : "-"}{entry.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default WalletPage;
