import { createContext, useContext, useMemo, useState } from "react";
import { translations } from "../data/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("cx_language") || "en");

  const switchLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("cx_language", lang);
  };

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  const value = useMemo(
    () => ({ language, switchLanguage, t, availableLanguages: ["en", "hi", "ta", "te"] }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
