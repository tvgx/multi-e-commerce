import Link from "next/link";
import { ArrowRight, Zap, Target, LayoutTemplate, ShieldCheck, Code2, Rocket, PlayCircle } from "lucide-react";
import { CreateShopButton } from "@/components/home/CreateShopButton";
import { getT } from "@/lib/i18n";


export default async function PlatformLandingPage() {
  const t = await getT("admin");
  return (
    <div className="min-h-screen bg-[#030014] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/30 blur-[120px] mix-blend-screen pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[100px] mix-blend-screen pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">OmniCommerce</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="#features" className="hover:text-white transition-colors">{t("landing.navFeatures")}</Link>
            <Link href="#architecture" className="hover:text-white transition-colors">{t("landing.navArchitecture")}</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">{t("landing.navPricing")}</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-white/80 hover:text-white transition-colors hidden sm:block">
              {t("landing.login")}
            </Link>
            <CreateShopButton variant="secondary" />

          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-6 pt-20 text-center lg:pt-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            {t("landing.heroBadge")}
          </div>
          <h1 className="mx-auto max-w-5xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            {t("landing.heroTitle1")} <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 animate-gradient-x">
              {t("landing.heroTitle2")}
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-slate-400 leading-relaxed">
            {t("landing.heroDesc1")} <strong className="text-white font-semibold">Zero-File Layout Engine</strong> {t("landing.heroDesc2")}
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
            <CreateShopButton />

            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10">
              <PlayCircle className="w-5 h-5" />
              {t("landing.watchDemo")}
            </button>
          </div>
        </div>

        {/* Dashboard Preview / Illustration */}
        <div className="mx-auto max-w-7xl px-6 mt-20 lg:mt-32 relative">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-2xl shadow-2xl relative z-10">
            <div className="rounded-xl border border-white/5 bg-black/50 overflow-hidden relative">
              {/* Fake Browser Top */}
              <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="mx-auto w-1/2 h-5 rounded-md bg-white/5 border border-white/5 flex items-center justify-center">
                  <span className="text-[10px] text-white/30 font-mono">mystore.omnicommerce.com</span>
                </div>
              </div>
              {/* Fake Content */}
              <div className="aspect-[16/9] bg-gradient-to-br from-[#0f172a] to-[#020617] p-8 flex flex-col gap-6 relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="flex justify-between items-center relative z-10 w-full">
                  <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse" />
                  <div className="flex gap-3">
                    <div className="h-8 w-8 bg-white/10 rounded-full animate-pulse" />
                    <div className="h-8 w-24 bg-indigo-500/20 rounded-full border border-indigo-500/30" />
                  </div>
                </div>
                <div className="flex gap-6 h-full relative z-10">
                  <div className="w-1/4 flex flex-col gap-4">
                    <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                    <div className="h-48 bg-white/5 rounded-xl border border-white/5" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent" />
                    <LayoutTemplate className="w-24 h-24 text-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow Behind the preview */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[40%] bg-indigo-500/30 blur-[120px] rounded-full -z-10" />
        </div>

        {/* Features Section */}
        <div id="features" className="mx-auto max-w-7xl px-6 mt-32">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
              {t("landing.featuresSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<ShieldCheck />}
              title={t("landing.feat1Title")}
              desc={t("landing.feat1Desc")}
            />
            <FeatureCard
              icon={<Code2 />}
              title={t("landing.feat2Title")}
              desc={t("landing.feat2Desc")}
            />
            <FeatureCard
              icon={<Target />}
              title={t("landing.feat3Title")}
              desc={t("landing.feat3Desc")}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black/40 pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="text-indigo-500 w-5 h-5 fill-current" />
            <span className="text-xl font-bold tracking-tight text-white">OmniCommerce</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2026 DATN Xuan. Platform Multi-tenant Architecture.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative rounded-3xl bg-white/5 border border-white/10 p-8 transition-all hover:bg-white/10 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-400 leading-relaxed text-sm">
          {desc}
        </p>
      </div>
    </div>
  );
}
