import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("admin");
  return {
    title: t("legal.privacyMetaTitle"),
    description: t("legal.privacyMetaDesc"),
  };
}

export default async function PrivacyPolicyPage() {
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

        <h1 className="text-3xl font-bold text-white mb-2">{t("legal.privacyTitle")}</h1>
        <p className="text-sm text-slate-500 mb-10">{t("legal.lastUpdated")}</p>

        <div className="space-y-8 leading-relaxed text-sm md:text-base">
          <section>
            <p>{t("legal.privacyIntro")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              {t("legal.privacyH1")}
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-200">{t("legal.privacyItem1Label")}</strong>
                {t("legal.privacyItem1Body")}
              </li>
              <li>
                <strong className="text-slate-200">{t("legal.privacyItem2Label")}</strong>
                {t("legal.privacyItem2Body")}
              </li>
              <li>
                <strong className="text-slate-200">{t("legal.privacyItem3Label")}</strong>
                {t("legal.privacyItem3Body")}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              {t("legal.privacyH2")}
            </h2>
            <p>{t("legal.privacyP2")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">
              {t("legal.privacyH3")}
            </h2>
            <p>{t("legal.privacyP3")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">{t("legal.privacyH4")}</h2>
            <p>{t("legal.privacyP4")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">{t("legal.privacyH5")}</h2>
            <p>{t("legal.privacyP5")}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">{t("legal.privacyH6")}</h2>
            <p>
              {t("legal.privacyP6Prefix")}
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
          <Link href="/legal/terms" className="text-indigo-400 hover:text-indigo-300">
            {t("legal.toTerms")}
          </Link>
        </div>
      </div>
    </main>
  );
}
