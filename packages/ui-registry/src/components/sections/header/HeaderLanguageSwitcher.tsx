'use client';

import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLocale } from '@ecommerce/i18n/src/react';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type Language } from '@ecommerce/i18n/src/types';

/**
 * Language switcher rendered inside the storefront Header. Switching writes the
 * `NEXT_LOCALE` cookie and reloads so the whole tree (server + client) re-renders
 * against the new locale — we never mutate the shared i18next instance at runtime.
 *
 * `previewMode` is passed when the Header is rendered inside the admin builder
 * canvas; there it must stay inert (no cookie writes / reloads), so it renders a
 * static label.
 */
export function HeaderLanguageSwitcher({ previewMode = false }: { previewMode?: boolean }) {
  const currentLang = useLocale();
  const [open, setOpen] = useState(false);

  const select = (lang: Language) => {
    setOpen(false);
    if (previewMode || lang === currentLang) return;
    // 1 year, root path — read back by each app's server layout via next/headers.
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !previewMode && setOpen((v) => !v)}
        aria-label="Change language"
        className="flex items-center gap-1.5 text-sm font-medium opacity-80 hover:opacity-100 transition-opacity"
      >
        <Globe size={16} />
        <span className="uppercase">{currentLang}</span>
      </button>

      {open && !previewMode && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-white text-slate-700 rounded-xl shadow-xl border border-slate-100 py-1 z-50">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => select(lang)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                currentLang === lang ? 'text-brand font-medium' : 'text-slate-600'
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
