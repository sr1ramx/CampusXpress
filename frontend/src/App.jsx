import { useEffect, useMemo, useRef } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import TopNav from "./components/TopNav";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ShopProvider } from "./context/ShopContext";
import UserLayout from "./layouts/UserLayout";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentPage from "./pages/PaymentPage";
import TrackingPage from "./pages/TrackingPage";
import RecyclePage from "./pages/RecyclePage";
import WalletPage from "./pages/WalletPage";
import OrdersPage from "./pages/OrdersPage";
import AdminPage from "./pages/AdminPage";
import DeliveryPage from "./pages/DeliveryPage";
import SettingsPage from "./pages/SettingsPage";
import RentPage from "./pages/RentPage";

function RoleRoute({ allowedRole, children }) {
  const { user } = useAuth();

  if (user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function UserRoutes() {
  return (
    <UserLayout>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/tracking/:orderId" element={<TrackingPage />} />
        <Route path="/recycle" element={<RecyclePage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/rent" element={<RentPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </UserLayout>
  );
}

function Shell() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { language, switchLanguage } = useLanguage();
  const role = useMemo(() => user?.role || "user", [user?.role]);
  const initializedLanguage = useRef(false);

  useEffect(() => {
    if (!initializedLanguage.current && user?.language && user.language !== language) {
      switchLanguage(user.language);
      initializedLanguage.current = true;
    }
  }, [user?.language, language, switchLanguage]);

  useEffect(() => {
    if (!isAuthenticated) {
      initializedLanguage.current = false;
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AuthPage onLogin={login} />;
  }

  return (
    <BrowserRouter>
      <ShopProvider>
        <main className="min-h-screen bg-[#f8fdf4] text-slate-900">
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(186,230,92,0.25),transparent_32%),radial-gradient(circle_at_85%_82%,rgba(253,224,71,0.24),transparent_36%)]" />

          {role !== "user" && <TopNav user={user} onLogout={logout} role={role} />}

          <div className="relative mx-auto w-full max-w-7xl px-0 py-0 md:px-6 md:py-8">
            <Routes>
              <Route path="/" element={<Navigate to={role === "user" ? "/home" : role === "admin" ? "/admin" : "/delivery"} replace />} />
              <Route
                path="/*"
                element={
                  <RoleRoute allowedRole="user">
                    <UserRoutes />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <RoleRoute allowedRole="admin">
                    <div className="px-4 py-6 md:px-2">
                      <AdminPage />
                    </div>
                  </RoleRoute>
                }
              />
              <Route
                path="/delivery"
                element={
                  <RoleRoute allowedRole="partner">
                    <div className="px-4 py-6 md:px-2">
                      <DeliveryPage />
                    </div>
                  </RoleRoute>
                }
              />
            </Routes>
          </div>
        </main>
      </ShopProvider>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Shell />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
