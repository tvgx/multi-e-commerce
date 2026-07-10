import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "@ecommerce/ui-registry/src/components/ui/toaster";
import { I18nProvider } from "@ecommerce/i18n/src/react";
import type { Language } from "@ecommerce/i18n/src/types";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Base URL cho metadata tuyệt đối (OG/canonical). Ghi đè bằng NEXT_PUBLIC_ADMIN_URL.
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.localhost";

export const metadata: Metadata = {
  metadataBase: new URL(ADMIN_URL),
  applicationName: "OmniAdmin",
  title: {
    default: "OmniAdmin — Quản trị cửa hàng",
    template: "%s — OmniAdmin",
  },
  description:
    "Bảng điều khiển quản trị nền tảng thương mại điện tử OmniCommerce.",
  // Admin là dashboard nội bộ (phải đăng nhập) → không cho search engine index.
  // Kết hợp robots.ts + header X-Robots-Tag (next.config.ts) để phủ toàn bộ.
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    type: "website",
    siteName: "OmniAdmin",
    title: "OmniAdmin — Quản trị cửa hàng",
    description:
      "Bảng điều khiển quản trị nền tảng thương mại điện tử OmniCommerce.",
  },
  // icon.svg / apple-icon.tsx / manifest.ts được Next tự nhận qua file-convention.
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale: Language =
    (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Anti-flicker: áp class dark trước khi paint. Mặc định DARK (giữ
            nguyên look hiện tại của dashboard); user đổi qua ThemeToggle
            (localStorage 'admin-theme'). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('admin-theme')!=='light'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider locale={locale}>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
