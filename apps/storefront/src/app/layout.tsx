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
  title: "E-Commerce Platform",
  description: "No-code e-commerce builder",
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
