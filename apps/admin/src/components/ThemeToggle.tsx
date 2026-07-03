'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * Nút chuyển sáng/tối cho admin. Class `dark` trên <html> được script
 * anti-flicker trong layout.tsx đặt trước khi paint; component này chỉ đọc
 * trạng thái hiện có và toggle + lưu localStorage ('admin-theme').
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  // Đọc sau mount để tránh lệch SSR/client (server không biết localStorage).
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('admin-theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className={`p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${className}`}
    >
      {isDark === false ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
