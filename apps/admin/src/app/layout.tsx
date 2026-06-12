import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "OmniAdmin — Quản trị cửa hàng",
  description: "Bảng điều khiển quản trị nền tảng thương mại điện tử",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale: Language =
    (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi";

  return (
    <html lang={locale}>
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
