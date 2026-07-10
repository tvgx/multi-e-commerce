'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileQuestion } from 'lucide-react';
import { useTranslations } from '@ecommerce/i18n/src/react';

/** Root 404 cho admin: đưa về đúng "trang chủ" theo ngữ cảnh đang đứng. */
export default function AdminNotFound() {
  const t = useTranslations('admin');
  const pathname = usePathname() || '';
  const segs = pathname.split('/').filter(Boolean);

  // /dashboard/<shopId>/... → về tổng quan của đúng shop đó.
  // /dashboard/...           → về tổng quan dashboard.
  // ngoài dashboard           → về landing công khai.
  let home = '/';
  if (segs[0] === 'dashboard') {
    home = segs[1] ? `/dashboard/${segs[1]}` : '/dashboard';
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-[#030014]">
      <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
        <FileQuestion className="w-8 h-8 text-indigo-400" />
      </div>
      <p className="text-7xl font-black text-white/10 mb-4">404</p>
      <h1 className="text-2xl font-bold text-white mb-2">{t('notFound.title')}</h1>
      <p className="text-slate-400 max-w-md mb-8">{t('notFound.desc')}</p>
      <Link
        href={home}
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
      >
        {t('notFound.home')}
      </Link>
    </div>
  );
}
