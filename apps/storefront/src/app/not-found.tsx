import Link from 'next/link';

/** Root 404 for paths that don't resolve to any shop/route. */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-7xl font-black text-slate-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Trang không tồn tại</h1>
      <p className="text-slate-500 max-w-md mb-8">
        Đường dẫn bạn truy cập không có trên hệ thống.
      </p>
      <Link
        href="/"
        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
