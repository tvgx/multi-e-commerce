'use client';

import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import Cookies from 'js-cookie';
import { useLocale } from '@ecommerce/i18n/src/react';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type Language } from '@ecommerce/i18n/src/types';

export function LanguageSwitcher() {
  const currentLang = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (lang: Language) => {
    setIsOpen(false);
    if (lang === currentLang) return;
    Cookies.set('NEXT_LOCALE', lang, { expires: 365, path: '/' });
    // The whole tree (server + client) re-renders against the new cookie locale
    // on reload, so we never mutate the shared i18next instance at runtime.
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand transition-colors"
      >
        <Globe size={16} />
        <span className="uppercase">{currentLang}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleSelect(lang)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${currentLang === lang ? 'text-brand font-medium' : 'text-slate-600'}`}
            >
              {LANGUAGE_NAMES[lang]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
