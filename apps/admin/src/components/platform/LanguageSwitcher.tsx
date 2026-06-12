"use client";

import React, { useState } from "react";
import { Globe } from "lucide-react";
import { useLocale } from "@ecommerce/i18n/src/react";
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type Language } from "@ecommerce/i18n/src/types";

export function LanguageSwitcher() {
  const currentLang = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (lang: Language) => {
    setIsOpen(false);
    if (lang === currentLang) return;
    // Persist for a year; the whole tree re-renders against the new cookie
    // locale on reload (server + client stay in sync).
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800 text-sm font-medium"
      >
        <Globe size={18} />
        <span className="uppercase">{currentLang}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-40 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl z-50 py-1">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleSelect(lang)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 transition-colors ${
                currentLang === lang ? "text-indigo-400 font-medium" : "text-zinc-300"
              }`}
            >
              {LANGUAGE_NAMES[lang]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
