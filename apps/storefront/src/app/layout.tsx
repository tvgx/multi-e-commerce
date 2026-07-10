import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "@ecommerce/ui-registry/src/components/ui/toaster";
import { I18nProvider } from "@ecommerce/i18n/src/react";
import type { Language } from "@ecommerce/i18n/src/types";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Platform-level defaults. Per-shop layouts/pages override title, description,
// canonical and Open Graph with the merchant's own data. `metadataBase` lets
// every relative canonical/OG URL resolve to an absolute URL.
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Cửa hàng trực tuyến",
    template: "%s",
  },
  description: "Cửa hàng trực tuyến được xây dựng trên nền tảng OmniCommerce.",
  applicationName: "OmniCommerce",
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: "OmniCommerce",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reflect the buyer's chosen language so screen readers / hyphenation are
  // correct. Storefront content is Vietnamese by default.
  const locale: Language =
    (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi";

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <I18nProvider locale={locale}>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
