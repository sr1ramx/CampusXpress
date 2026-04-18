import { useState } from "react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

function AuthPage({ onLogin }) {
  const { language, switchLanguage, t, availableLanguages } = useLanguage();
  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", phone: "" });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    try {
      const endpoint = isSignup ? "/auth/signup" : "/auth/login";
      const payload = isSignup ? { ...form, language } : { email: form.email, password: form.password };
      const response = await api.post(endpoint, payload);
      onLogin(response.data.token, response.data.user);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Authentication failed");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8fdf4] px-4 py-10 text-slate-900 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(253,224,71,0.35),transparent_33%),radial-gradient(circle_at_82%_84%,rgba(190,242,100,0.32),transparent_38%)]" />
      <div className="relative mx-auto max-w-4xl rounded-[2rem] border border-lime-200 bg-white/90 p-8 shadow-[0_15px_45px_rgba(132,204,22,0.18)] backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold text-lime-700">
          {t("fastCampus")}
        </div>
        <h1 className="mt-3 font-display text-4xl text-slate-900">{t("appName")}</h1>
        <p className="mt-2 max-w-xl text-slate-600">Blinkit-like instant convenience, now optimized for campus life with recycling and carbon rewards.</p>

        <label className="mt-4 block max-w-xs text-sm text-slate-700">
          Language
          <select
            className="mt-1 w-full rounded-xl border border-lime-200 bg-white px-4 py-2"
            value={language}
            onChange={(event) => switchLanguage(event.target.value)}
          >
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
        </label>

        <form onSubmit={submit} className="mt-8 grid gap-4 md:grid-cols-2">
          {isSignup && (
            <input
              placeholder={t("fullName")}
              className="rounded-xl border border-lime-200 bg-white px-4 py-3"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          )}
          <input
            placeholder={t("email")}
            className="rounded-xl border border-lime-200 bg-white px-4 py-3"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <input
            placeholder={t("password")}
            className="rounded-xl border border-lime-200 bg-white px-4 py-3"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />

          {isSignup && (
            <input
              placeholder="Phone"
              className="rounded-xl border border-lime-200 bg-white px-4 py-3"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          )}

          {isSignup && (
            <select
              className="rounded-xl border border-lime-200 bg-white px-4 py-3"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              <option value="user">User</option>
              <option value="partner">Delivery Partner</option>
              <option value="admin">Admin</option>
            </select>
          )}

          <div className="md:col-span-2 flex items-center gap-3">
            <button className="rounded-full bg-lime-500 px-6 py-3 font-semibold text-white hover:bg-lime-600" type="submit">
              {isSignup ? t("signup") : t("login")}
            </button>
            <button className="text-sm text-slate-700 underline-offset-4 hover:underline" type="button" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? "Already registered? Login" : "New user? Signup"}
            </button>
          </div>
          {error && <p className="md:col-span-2 text-sm text-rose-300">{error}</p>}
        </form>
      </div>
    </main>
  );
}

export default AuthPage;
