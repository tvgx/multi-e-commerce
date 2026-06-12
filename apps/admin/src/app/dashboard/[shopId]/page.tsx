"use client";

import React, { use } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { storefrontUrl } from "@/lib/urls";
import { 
  Rocket, 
  Settings, 
  LayoutTemplate, 
  Package, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  Globe,
  Loader2,
  MessageCircle,
  Circle, 
  Lock, 
  Layers, 
  Store, 
  Palette, 
  CreditCard, 
  Truck
} from "lucide-react";
import Link from "next/link";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { ChatPanel } from "./ChatPanel";
import { useTranslations } from "@ecommerce/i18n/src/react";

const STEP_ICONS: Record<string, React.ReactNode> = {
  step1: <Rocket className="w-5 h-5" />,
  step2: <Package className="w-5 h-5" />,
  step3: <Layers className="w-5 h-5" />,
  step4: <Store className="w-5 h-5" />,
  step5: <Palette className="w-5 h-5" />,
  step6: <CreditCard className="w-5 h-5" />,
  step7: <Truck className="w-5 h-5" />,
  step8: <Globe className="w-5 h-5" />,
};

export default function OnboardingDashboard({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = React.use(params);
  const { status, loading, progressPercentage, refresh } = useOnboarding(shopId);
  const t = useTranslations("admin");

  const STEP_ACTIONS: Record<string, { label: string; href: string }> = {
    step2: { label: t("dashboard.actions.addProduct"), href: "/products" },
    step3: { label: t("dashboard.actions.createCollection"), href: "/collections" },
    step4: { label: t("dashboard.actions.setupMenus"), href: "/online-store/navigation" },
    step5: { label: t("dashboard.actions.customizeTheme"), href: "/online-store/themes" },
    step6: { label: t("dashboard.actions.setupPayment"), href: "/payments" },
    step7: { label: t("dashboard.actions.configureShipping"), href: "/settings/shipping" },
    step8: { label: t("dashboard.actions.verifyDomain"), href: "/settings/domain" },
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const stepsArray = status ? Object.entries(status.steps).sort() : [];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Analytics Dashboard */}
      {progressPercentage === 100 && (
        <>
          <AnalyticsDashboard shopId={shopId} />
          
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{t("dashboard.liveSupport")}</h2>
            </div>
            <ChatPanel shopId={shopId} />
          </div>
        </>
      )}
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-900 p-10 text-white shadow-2xl">
         <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-white/10 blur-[80px] -rotate-45 pointer-events-none" />
         
         <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex-1 space-y-4 text-center md:text-left">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                 <Rocket size={14} /> {t("dashboard.missionControl")}
               </div>
               <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t("dashboard.welcomeTitle")}</h1>
               <p className="text-indigo-100/80 text-lg max-w-xl">
                 {t("dashboard.completedPrefix")} <span className="text-white font-bold">{progressPercentage}%</span> {t("dashboard.setupSuffix")}
               </p>
            </div>

            <div className="relative h-40 w-40 flex items-center justify-center">
               <svg className="h-full w-full -rotate-90">
                 <circle
                   cx="80"
                   cy="80"
                   r="70"
                   fill="transparent"
                   stroke="rgba(255,255,255,0.1)"
                   strokeWidth="10"
                 />
                 <circle
                   cx="80"
                   cy="80"
                   r="70"
                   fill="transparent"
                   stroke="white"
                   strokeWidth="10"
                   strokeDasharray={440}
                   strokeDashoffset={440 - (440 * progressPercentage) / 100}
                   strokeLinecap="round"
                   className="transition-all duration-1000 ease-in-out"
                 />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-4xl font-extrabold">{progressPercentage}%</span>
                  <span className="text-[10px] uppercase font-bold text-white/60">{t("dashboard.done")}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Checklist Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stepsArray.map(([key, step], index) => {
          const isCompleted = step.status === "COMPLETED";
          const isLocked = step.status === "LOCKED";
          const action = STEP_ACTIONS[key];

          return (
            <div 
              key={key}
              className={`group relative rounded-3xl border p-6 transition-all duration-300 ${
                isCompleted 
                ? "bg-emerald-500/10 border-emerald-500/20" 
                : isLocked 
                ? "bg-slate-900/40 border-white/5 opacity-60 grayscale blur-[0.5px]" 
                : "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-indigo-500/50 hover:-translate-y-1 shadow-lg"
              }`}
            >
              <div className="flex flex-col h-full gap-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl ${
                    isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-400"
                  }`}>
                    {STEP_ICONS[key]}
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 className="text-emerald-400 w-6 h-6" />
                  ) : isLocked ? (
                    <Lock className="text-slate-600 w-5 h-5" />
                  ) : (
                    <Circle className="text-indigo-500/40 w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className={`font-bold ${isCompleted ? "text-emerald-300" : "text-white"}`}>
                    {index + 1}. {step.label}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {t("dashboard.stepHelp")}
                  </p>
                </div>

                {!isCompleted && !isLocked && action && (
                  <div className="mt-auto pt-4">
                    <Link 
                      href={`/dashboard/${shopId}${action.href}`}
                      className="group/btn inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {action.label}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                )}

                {isCompleted && (
                  <div className="mt-auto pt-4 flex items-center gap-2 text-emerald-500/60 text-xs font-bold uppercase tracking-wider">
                     <CheckCircle2 size={12} /> {t("dashboard.taskFinished")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Launch CTA */}
      {progressPercentage === 100 && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-bounce-subtle">
           <div className="flex items-center gap-4 text-center md:text-left">
              <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg">
                <Globe className="text-white w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-white">{t("dashboard.readyTitle")}</h2>
                 <p className="text-emerald-200/60">{t("dashboard.readyBody")}</p>
              </div>
           </div>
           <a 
             href={storefrontUrl(shopId)}
             target="_blank"
             className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
           >
             {t("dashboard.openStoreNow")}
           </a>
        </div>
      )}
    </div>
  );
}
