import { House, Search, Package, HandCoins, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const tabs = [
  { to: "/home", label: "Home", icon: House },
  { to: "/search", label: "Search", icon: Search },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/rent", label: "Rent", icon: HandCoins },
  { to: "/settings", label: "Settings", icon: Settings }
];

function BottomNav() {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-lime-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-2 py-3 text-[11px] ${
                isActive ? "text-lime-600" : "text-slate-500"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label === "Home"
              ? t("home")
              : label === "Search"
                ? t("search")
                : label === "Orders"
                  ? t("orders")
                  : label === "Rent"
                    ? t("rentNav")
                    : t("settings")}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
