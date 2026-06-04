'use client';

import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import Cookies from 'js-cookie';

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'English' }
];

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('vi');

  useEffect(() => {
    // Check cookie for preferred language
    const lang = Cookies.get('NEXT_LOCALE') || 'vi';
    setCurrentLang(lang);
  }, []);

  const handleSelect = (lang: string) => {
    setCurrentLang(lang);
    setIsOpen(false);
    Cookies.set('NEXT_LOCALE', lang, { expires: 365, path: '/' });
    
    // In a full i18n implementation, we'd router.refresh() or redirect
    // but for now we just trigger a window reload to apply changes
    window.location.reload();
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-emerald-500 transition-colors"
      >
        <Globe size={16} />
        <span className="uppercase">{currentLang}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${currentLang === lang.code ? 'text-emerald-600 font-medium' : 'text-slate-600'}`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
