"use client";

import { Globe2 } from "lucide-react";
import { useEffect, useState } from "react";

export type Language = "ar" | "en" | "zh" | "tr";

const languages: {
  code: Language;
  label: string;
}[] = [
  { code: "ar", label: "🇸🇦 العربية" },
  { code: "en", label: "🇬🇧 English" },
  { code: "zh", label: "🇨🇳 中文" },
  { code: "tr", label: "🇹🇷 Türkçe" },
];

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState<Language>("ar");

  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "healthnations-language"
    ) as Language | null;

    if (
      savedLanguage &&
      languages.some((item) => item.code === savedLanguage)
    ) {
      setTimeout(() => {
        setLanguage(savedLanguage);
        applyLanguage(savedLanguage);
      }, 0);

      return;
    }

    applyLanguage("ar");
  }, []);

  function changeLanguage(newLanguage: Language) {
    setLanguage(newLanguage);

    localStorage.setItem(
      "healthnations-language",
      newLanguage
    );

    applyLanguage(newLanguage);

    window.dispatchEvent(
      new CustomEvent("healthnations-language-change", {
        detail: newLanguage,
      })
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <Globe2 size={18} className="text-blue-700" />

      <select
        aria-label="Select language"
        value={language}
        onChange={(event) =>
          changeLanguage(event.target.value as Language)
        }
        className="cursor-pointer bg-transparent text-sm font-bold text-slate-700 outline-none"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function applyLanguage(language: Language) {
  if (typeof document === "undefined") return;

  document.documentElement.lang = language;
  document.documentElement.dir =
    language === "ar" ? "rtl" : "ltr";
}