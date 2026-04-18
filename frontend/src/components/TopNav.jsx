import { ArrowLeft, Leaf, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

function TopNav({ user, onLogout, role }) {
  const navigate = useNavigate();
  const roleLabel = {
    user: "User Window",
    partner: "Partner Window",
    admin: "Admin Window"
  }[role] || "User Window";

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(role === "admin" ? "/admin" : role === "partner" ? "/delivery" : "/home");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-lime-200/90 bg-[#fef08a]/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="rounded-full border border-lime-300 bg-white p-2 text-slate-700"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-500 text-white shadow-lg shadow-lime-700/20">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-slate-900">CampusXpress</h1>
            <p className="text-xs text-slate-700">Delivery in minutes + eco pickups</p>
          </div>
        </div>

        <div className="min-w-[220px] flex-1 md:max-w-sm">
          <label className="flex items-center gap-2 rounded-full border border-lime-300 bg-white px-4 py-2 shadow-sm">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search items, services"
              type="text"
            />
          </label>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span className="hidden rounded-full bg-white/80 px-3 py-1 font-semibold text-lime-700 md:block">
            {roleLabel}
          </span>
          <span className="hidden rounded-full border border-lime-300 bg-white/80 px-3 py-1 md:block">
            {user?.name || "Guest"}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full bg-lime-600 px-3 py-2 text-white hover:bg-lime-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
