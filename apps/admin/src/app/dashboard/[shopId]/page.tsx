"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useBuildStatus } from "@/hooks/useBuildStatus";
import { shopPublicUrl } from "@/lib/urls";
import { apiClient } from "@/lib/api-client";
import {
  Rocket,
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
  Palette,
  CreditCard,
  Truck,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { ChatPanel } from "./ChatPanel";
import { useTranslations } from "@ecommerce/i18n/src/react";

const STAGE_LABELS: Record<string, string> = {
  extract: "Đang trích xuất dữ liệu...",
  parse: "Đang chuẩn hóa cấu trúc...",
  assemble: "Đang ghép nối các trang...",
  compile: "Đang biên dịch giao diện...",
  "db-save": "Đang lưu vào Database...",
  minio: "Đang xuất bản tài nguyên...",
  published: "Hoàn tất!",
};

// Màn "Shop đang được tạo" — poll tiến độ build nền và hiển thị URL khi xong.
function FinalizingView({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const { status } = useBuildStatus(shopId, true, attempt);

  const percent = status?.percent ?? 0;
  const failed = status?.status === "FAILED";
  const done = status?.status === "COMPLETED";

  const retry = async () => {
    setRetrying(true);
    try {
      await apiClient.post(`/api/shops/${shopId}/build`, {}, { shopId });
      setAttempt((a) => a + 1);
    } catch {
      /* giữ nguyên trạng thái lỗi */
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <div className="rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-900 p-10 text-white shadow-2xl text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-indigo-200/70 mb-8">
          🚀 OmniAdmin · Khởi tạo cửa hàng
        </div>

        {failed ? (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-red-300" />
            </div>
            <h2 className="text-xl font-bold mb-2">Tạo shop thất bại</h2>
            <p className="text-indigo-100/70 text-sm mb-6">{status?.error || "Đã có lỗi xảy ra."}</p>
            <button
              onClick={retry}
              disabled={retrying}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-indigo-700 transition-all hover:bg-slate-100 disabled:opacity-60"
            >
              {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Thử lại
            </button>
          </>
        ) : done ? (
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-300" />
            </div>
            <h2 className="text-xl font-bold mb-2">Shop của bạn đã sẵn sàng tại:</h2>
            {status?.storefrontUrl && (
              <a
                href={status.storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-200 font-mono text-sm hover:underline mb-6 break-all"
              >
                <Globe size={16} /> {status.storefrontUrl}
              </a>
            )}
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mb-8">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: "100%" }} />
            </div>
            <button
              onClick={() => router.replace(`/dashboard/${shopId}`)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-indigo-700 transition-all hover:bg-slate-100"
            >
              Truy cập trang Quản trị <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-14 h-14 mx-auto animate-spin text-indigo-200 mb-6" />
            <h2 className="text-xl font-bold mb-2 uppercase tracking-wide">
              Shop của bạn đang được tạo, bạn chờ chút nhé...
            </h2>
            <p className="text-indigo-100/70 text-sm mb-8">
              {STAGE_LABELS[status?.stage || ""] || "Đang cấu hình Database và Giao diện..."}
            </p>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="text-2xl font-extrabold">{percent}%</div>
          </>
        )}
      </div>
    </div>
  );
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  step1: <Rocket className="w-5 h-5" />,
  step2: <Package className="w-5 h-5" />,
  step3: <Layers className="w-5 h-5" />,
  step4: <Palette className="w-5 h-5" />,
  step5: <CreditCard className="w-5 h-5" />,
  step6: <Truck className="w-5 h-5" />,
};

function DashboardContent({ shopId }: { shopId: string }) {
  const searchParams = useSearchParams();
  const finalizing = searchParams?.get("finalizing") === "true";
  const { status, loading, progressPercentage, allCompleted, shopDomain, refresh } = useOnboarding(shopId);
  const t = useTranslations("admin");

  // Sau khi bấm "Lưu và Hoàn tất" ở Billing & Shipping: hiển thị màn build nền.
  if (finalizing) {
    return <FinalizingView shopId={shopId} />;
  }

  const STEP_ACTIONS: Record<string, { label: string; href: string }> = {
    step2: { label: t("dashboard.actions.addProduct"), href: "/products" },
    step3: { label: t("dashboard.actions.createCollection"), href: "/collections" },
    step4: { label: t("dashboard.actions.customizeTheme"), href: "/online-store/themes" },
    step5: { label: t("dashboard.actions.setupPayment"), href: "/payments" },
    step6: { label: t("dashboard.actions.configureShipping"), href: "/settings/shipping" },
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const stepsArray = status ? Object.entries(status.steps).sort() : [];
  // Path-based (https://tvgx1.id.vn/<slug>) — subdomain style chưa chắc sống
  // trên mọi môi trường, còn path thì luôn đúng cả dev lẫn prod.
  const shopUrl = shopPublicUrl({ id: shopId, domain: shopDomain });

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Analytics Dashboard + Live Support — shown when all steps are complete */}
      {allCompleted && (
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

      {/* Banner: Shop URL (when all complete) or Progress (when in progress) */}
      {allCompleted ? (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 p-10 text-white shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-white/10 blur-[80px] -rotate-45 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                <CheckCircle2 size={14} /> {t("dashboard.shopLiveTitle")}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t("dashboard.readyTitle")}</h1>
              <p className="text-emerald-100/80 text-lg max-w-xl">
                {t("dashboard.shopLiveBody")}
              </p>
              <a
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-200 font-mono text-sm hover:underline break-all"
              >
                <Globe size={16} /> {shopUrl}
              </a>
            </div>

            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white hover:bg-slate-100 text-emerald-700 font-bold rounded-2xl shadow-xl shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              {t("dashboard.visitStore")} <ExternalLink size={18} />
            </a>
          </div>
        </div>
      ) : (
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
      )}

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
    </div>
  );
}

export default function OnboardingDashboard({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = React.use(params);
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <DashboardContent shopId={shopId} />
    </Suspense>
  );
}
