import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { getT } from "@/lib/i18n";

// Header mảnh luôn hiển thị ở MỌI bước của flow tạo shop (subdomain → design →
// navigation → billing) để chủ shop quay lại được trang quản trị tổng (TODO 4).
export default async function CreateShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getT("admin");
  return (
    <AuthGuard>
      <div className="h-screen flex flex-col">
        <div className="h-10 shrink-0 flex items-center px-4 bg-[#050510] border-b border-white/10 z-50">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("createShop.backToAdmin")}
          </Link>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </AuthGuard>
  );
}
