"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { NavigationEditor } from "@/components/builder/NavigationEditor";
import { WizardProgress } from "../../components/wizard-progress";

function NavigationStep() {
  const searchParams = useSearchParams();
  const shopId = searchParams?.get("shopId") || "";
  const loadTemplate = useBuilderStore((s) => s.loadTemplate);

  useEffect(() => {
    if (shopId) loadTemplate(shopId);
  }, [shopId, loadTemplate]);

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <WizardProgress current="navigation" />
        <NavigationEditor shopId={shopId} isWizard />
      </div>
    </div>
  );
}

export default function GuidedNavigationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050510]" />}>
      <NavigationStep />
    </Suspense>
  );
}
