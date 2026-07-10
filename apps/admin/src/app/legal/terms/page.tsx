import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("admin");
  return {
    title: t("legal.termsMetaTitle"),
    description: t("legal.termsMetaDesc"),
  };
}

export default async function TermsOfServicePage() {
  const t = await getT("admin");
  return (
    <main className="min-h-screen bg-[#030014] text-slate-300 px-6 py-16 font-sans">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("legal.backHome")}
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">{t("legal.termsTitle")}</h1>
        <p className="text-sm text-slate-500 mb-10">{t("legal.lastUpdated")}</p>

        <div className="space-y-8 leading-relaxed text-sm md:text-base">
          <section>
            <p>{t("legal.termsIntro")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">{t("legal.termsH1")}</h2>
            <p>{t("legal.termsP1")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              {t("legal.termsH2")}
            </h2>
            <p>{t("legal.termsP2")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              {t("legal.termsH3")}
            </h2>
            <p>{t("legal.termsP3")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              {t("legal.termsH4")}
            </h2>
            <p>{t("legal.termsP4")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">{t("legal.termsH5")}</h2>
            <p>{t("legal.termsP5")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              {t("legal.termsH6")}
            </h2>
            <p>{t("legal.termsP6")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">{t("legal.termsH7")}</h2>
            <p>
              {t("legal.termsP7Prefix")}
              <a
                href={`mailto:${t("legal.contactEmail")}`}
                className="text-indigo-400 hover:text-indigo-300"
              >
                {t("legal.contactEmail")}
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-sm">
          <Link href="/legal/privacy" className="text-indigo-400 hover:text-indigo-300">
            {t("legal.toPrivacy")}
          </Link>
        </div>
      </div>
    </main>
  );
}
