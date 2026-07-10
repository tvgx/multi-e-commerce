'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

/** Shown when a shop page / product / collection isn't found (notFound()). */
export default function ShopNotFound() {
  const params = useParams();
  const pathname = usePathname();

  // Trỏ "Về trang chủ" đúng shop hiện tại. Ưu tiên param [shopSlug] (có cả khi
  // truy cập qua subdomain/tên miền riêng — middleware rewrite về /<slug>/...);
  // nếu useParams rỗng trong boundary not-found thì lấy segment đầu của URL
  // path-based. Chỉ khi thật sự không có shop context mới về apex.
  const slugFromParams = (params?.shopSlug as string) || '';
  const slugFromPath = pathname?.split('/').filter(Boolean)[0] || '';
  const shopSlug = slugFromParams || slugFromPath;
  const home = shopSlug ? `/${shopSlug}` : '/';

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
      <p className="text-6xl font-black text-slate-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Không tìm thấy trang</h1>
      <p className="text-slate-500 max-w-md mb-8">
        Trang hoặc sản phẩm bạn tìm có thể đã bị xoá hoặc đổi đường dẫn.
      </p>
      <Link
        href={home}
        className="bg-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand/90 transition-colors"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
