"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BuilderProvider } from "./components/builder-provider";
import { GuidedTopbar } from "./components/guided-topbar";
import { SectionList } from "@/components/builder/SectionList";
import { PropEditor } from "@/components/builder/PropEditor";
import { SetupWizard } from "@/components/builder/SetupWizard";
import { CanvasRenderer } from "@ecommerce/ui-registry/src/components/builder/canvas-renderer";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { WizardProgress } from "../components/wizard-progress";
import { apiClient } from "@/lib/api-client";

export default function DesignPage() {
  return (
    <BuilderProvider>
      {/* h-full (không h-screen): layout create-shop đã chiếm 40px cho header quay lại admin */}
      <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
        {/* Tiến trình wizard tổng — đồng bộ ở mọi bước (Thiết kế → Điều hướng → Billing) */}
        <div className="h-10 shrink-0 border-b border-border bg-card flex items-center justify-center">
          <WizardProgress current="design" />
        </div>

        <Suspense
          fallback={<div className="h-14 border-b border-border bg-card animate-pulse" />}
        >
          <GuidedTopbar />
        </Suspense>

        <DesignWorkspace />
      </div>
    </BuilderProvider>
  );
}

function DesignWorkspace() {
  const deviceMode = useBuilderStore((s) => s.deviceMode);
  const isLoading = useBuilderStore((s) => s.isLoading);
  const storeShopId = useBuilderStore((s) => s.shopId);
  const theme = useBuilderStore((s) => s.theme) as Record<string, any>;
  const searchParams = useSearchParams();
  const shopId = searchParams?.get("shopId") || "";

  const [showSetup, setShowSetup] = React.useState(false);
  const setupCheckedRef = React.useRef(false);

  // Same gateway as the dashboard builder: a brand-new shop lands on Setup first.
  // Chỉ check sau khi loadTemplate của ĐÚNG shop này chạy xong (storeShopId khớp)
  // — effect con chạy trước effect cha nên lúc mount isLoading=false nhưng store
  // còn rỗng, check sớm sẽ mở Setup với theme trống (mất prefill).
  React.useEffect(() => {
    if (!isLoading && shopId && storeShopId === shopId && !setupCheckedRef.current) {
      setupCheckedRef.current = true;
      if (!theme?.setupCompleted) setShowSetup(true);
    }
  }, [isLoading, theme, shopId, storeShopId]);

  // PropEditor's default panel reopens Setup via this event.
  React.useEffect(() => {
    const open = () => setShowSetup(true);
    window.addEventListener("builder:open-setup", open);
    return () => window.removeEventListener("builder:open-setup", open);
  }, []);

  // Real products for a truthful preview (falls back to sample inside the canvas).
  const [previewProducts, setPreviewProducts] = React.useState<any[]>([]);
  React.useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<any>(`/api/catalog/products/shop/${shopId}?limit=12`, { shopId });
        const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) setPreviewProducts(list);
      } catch { /* keep sample fallback */ }
    })();
    return () => { cancelled = true; };
  }, [shopId]);

  if (showSetup && shopId) {
    return (
      <div className="flex-1 overflow-hidden">
        <SetupWizard shopId={shopId} onComplete={() => setShowSetup(false)} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: section tree */}
      <div className="w-72 border-r border-border bg-card overflow-y-auto shrink-0 flex flex-col">
        <SectionList />
      </div>

      {/* Center: canvas (navigation is neutralized inside CanvasRenderer) */}
      <div className="flex-1 bg-background overflow-auto flex items-start justify-center p-8">
        <div
          className={`transition-all duration-300 bg-white shadow-2xl overflow-hidden border border-border ${
            deviceMode === "mobile"
              ? "w-[390px] rounded-[2rem]"
              : "w-full max-w-[1280px] rounded-xl"
          }`}
        >
          <CanvasRenderer previewProducts={previewProducts} />
        </div>
      </div>

      {/* Right: properties */}
      <div className="w-72 border-l border-border bg-card overflow-y-auto shrink-0">
        <PropEditor />
      </div>
    </div>
  );
}
