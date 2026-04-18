import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Search, ShoppingBag, LogOut } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { useLanguage } from "../context/LanguageContext";

function UserLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { cart } = useShop();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/home");
  };

  return (
    <main className="min-h-screen bg-[#f7fdf3] pb-24 text-slate-900 md:pb-8">
      <header className="sticky top-0 z-30 border-b border-lime-200 bg-[#fef08a]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={goBack}
            className="rounded-full border border-lime-300 bg-white p-2 text-slate-700"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 md:flex"
          >
            <MapPin className="h-4 w-4 text-lime-600" />
            {`${t("deliverTo")} `}{user?.name || t("campusUser")}
          </button>

          <button
            type="button"
            onClick={() => navigate("/search")}
            className="flex flex-1 items-center gap-2 rounded-full border border-lime-300 bg-white px-4 py-2 text-sm text-slate-500"
          >
            <Search className="h-4 w-4" />
            {t("searchPlaceholder")}
          </button>

          <Link to="/cart" className="relative rounded-full bg-lime-600 p-2 text-white">
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-slate-900 px-1.5 text-[10px] text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={logout}
            className="hidden rounded-full bg-white p-2 text-slate-600 md:block"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-auto hidden w-full max-w-6xl gap-2 px-6 pb-3 md:flex">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `rounded-full px-3 py-1.5 text-xs font-semibold ${
                isActive ? "bg-lime-600 text-white" : "bg-white text-slate-700"
              }`
            }
          >
            {t("home")}
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `rounded-full px-3 py-1.5 text-xs font-semibold ${
                isActive ? "bg-lime-600 text-white" : "bg-white text-slate-700"
              }`
            }
          >
            {t("search")}
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `rounded-full px-3 py-1.5 text-xs font-semibold ${
                isActive ? "bg-lime-600 text-white" : "bg-white text-slate-700"
              }`
            }
          >
            {t("orders")}
          </NavLink>
          <NavLink
            to="/rent"
            className={({ isActive }) =>
              `rounded-full px-3 py-1.5 text-xs font-semibold ${
                isActive ? "bg-lime-600 text-white" : "bg-white text-slate-700"
              }`
            }
          >
            {t("rentNav")}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `rounded-full px-3 py-1.5 text-xs font-semibold ${
                isActive ? "bg-lime-600 text-white" : "bg-white text-slate-700"
              }`
            }
          >
            {t("settings")}
          </NavLink>
        </div>
      </header>

      <div key={location.pathname} className="route-enter mx-auto w-full max-w-6xl px-4 py-5 md:px-6">{children}</div>
      <BottomNav />
    </main>
  );
}

export default UserLayout;
