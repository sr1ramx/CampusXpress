import { useState } from "react";
import { supabase } from "../services/supabase";
import { useLanguage } from "../context/LanguageContext";

const formatAuthError = (message = "") => {
  const normalized = String(message).toLowerCase();

  if (normalized.includes("email rate limit exceeded")) {
    return "Too many signup attempts. Wait a minute and try again, or login if this account already exists.";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "This email is already registered. Please use login.";
  }

  return message || "Authentication failed";
};

function AuthPage({ onLogin }) {
  const { language, switchLanguage, t, availableLanguages } = useLanguage();
  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", phone: "" });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }

    try {
      if (isSignup) {
        const signUpResult = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              name: form.name,
              phone: form.phone,
              role: form.role,
              language
            }
          }
        });

        if (signUpResult.error) {
          throw signUpResult.error;
        }

        const session = signUpResult.data.session;
        const authUser = signUpResult.data.user;

        if (!authUser) {
          throw new Error("Unable to create user");
        }

        if (!session) {
          throw new Error("Signup succeeded. Please verify email, then login.");
        }

        const profileInsert = await supabase
          .from("profiles")
          .upsert({
            id: authUser.id,
            name: form.name,
            email: form.email,
            role: form.role,
            phone: form.phone || "",
            language,
            preferences: {
              notifications: true,
              darkMode: false,
              accountPreferences: ""
            }
          })
          .select("*")
          .single();

        if (profileInsert.error) {
          throw profileInsert.error;
        }

        const profile = profileInsert.data;
        onLogin(session.access_token, {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          points: profile.points,
          phone: profile.phone,
          language: profile.language,
          preferences: profile.preferences
        });
        return;
      }

      const loginResult = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });

      if (loginResult.error) {
        throw loginResult.error;
      }

      const session = loginResult.data.session;
      const authUser = loginResult.data.user;

      if (!session || !authUser) {
        throw new Error("Authentication failed");
      }

      const profileSelect = await supabase.from("profiles").select("*").eq("id", authUser.id).single();

      let profile = profileSelect.data;
      if (profileSelect.error) {
        const fallbackInsert = await supabase
          .from("profiles")
          .insert({
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email,
            email: authUser.email,
            role: authUser.user_metadata?.role || "user",
            phone: authUser.user_metadata?.phone || "",
            language: authUser.user_metadata?.language || "en"
          })
          .select("*")
          .single();

        if (fallbackInsert.error) {
          throw fallbackInsert.error;
        }
        profile = fallbackInsert.data;
      }

      onLogin(session.access_token, {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        points: profile.points,
        phone: profile.phone,
        language: profile.language,
        preferences: profile.preferences
      });
    } catch (requestError) {
      setError(formatAuthError(requestError.message));
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
