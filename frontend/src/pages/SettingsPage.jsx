import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const labels = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu"
};

function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { language, switchLanguage, availableLanguages, t } = useLanguage();
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [form, setForm] = useState({
    notifications: true,
    darkMode: false,
    accountPreferences: ""
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user?.preferences) {
      setForm({
        notifications: Boolean(user.preferences.notifications),
        darkMode: Boolean(user.preferences.darkMode),
        accountPreferences: user.preferences.accountPreferences || ""
      });
    }

    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      });
    }
  }, [user]);

  const save = async () => {
    const response = await api.patch("/auth/me", {
      name: profile.name,
      phone: profile.phone,
      language,
      preferences: form
    });
    updateUser(response.data);
    setMessage(t("settingsUpdated"));
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">{t("settings")}</h1>
        <p className="text-sm text-slate-600">Language and account preferences.</p>
      </div>

      <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm space-y-3">
        <label className="block text-sm text-slate-700">
          {t("language")}
          <select className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={language} onChange={(event) => switchLanguage(event.target.value)}>
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>{labels[lang]}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.notifications} onChange={(event) => setForm((prev) => ({ ...prev, notifications: event.target.checked }))} />
          {t("notifications")}
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.darkMode} onChange={(event) => setForm((prev) => ({ ...prev, darkMode: event.target.checked }))} />
          {t("darkMode")}
        </label>

        <label className="block text-sm text-slate-700">
          {t("accountPreferences")}
          <textarea className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" rows="3" value={form.accountPreferences} onChange={(event) => setForm((prev) => ({ ...prev, accountPreferences: event.target.value }))} />
        </label>

        <button type="button" onClick={save} className="rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white">{t("saveSettings")}</button>
        <button type="button" onClick={logout} className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">{t("logout")}</button>
        {message && <p className="text-sm text-emerald-700">{message}</p>}
      </div>

      <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">{t("profileInSettings")}</h2>
        <label className="block text-sm text-slate-700">
          {t("name")}
          <input
            className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
            value={profile.name}
            onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>

        <label className="block text-sm text-slate-700">
          {t("emailReadonly")}
          <input className="mt-1 w-full rounded-xl border border-lime-200 bg-slate-100 px-3 py-2" value={profile.email} disabled />
        </label>

        <label className="block text-sm text-slate-700">
          {t("phone")}
          <input
            className="mt-1 w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2"
            value={profile.phone}
            onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
          />
        </label>
      </div>
    </section>
  );
}

export default SettingsPage;
