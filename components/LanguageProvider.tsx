"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Language = "ar" | "en" | "zh" | "tr";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  isArabic: boolean;
};

const STORAGE_KEY = "healthnations-language";

const supportedLanguages: Language[] = [
  "ar",
  "en",
  "zh",
  "tr",
];

const LanguageContext =
  createContext<LanguageContextType | null>(null);

export default function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>("ar");

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem(STORAGE_KEY);

    if (
      savedLanguage &&
      supportedLanguages.includes(
        savedLanguage as Language
      )
    ) {
      setTimeout(() => {
        setLanguageState(
          savedLanguage as Language
        );

        applyDocumentLanguage(
          savedLanguage as Language
        );
      }, 0);

      return;
    }

    applyDocumentLanguage("ar");
  }, []);

  function setLanguage(
    newLanguage: Language
  ) {
    setLanguageState(newLanguage);

    localStorage.setItem(
      STORAGE_KEY,
      newLanguage
    );

    applyDocumentLanguage(newLanguage);
  }

  const isArabic = language === "ar";

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isArabic,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}

function applyDocumentLanguage(
  language: Language
) {
  document.documentElement.lang = language;

  document.documentElement.dir =
    language === "ar" ? "rtl" : "ltr";
}