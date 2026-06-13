"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const shopId = searchParams?.get("shopId") || "";
  const mode = searchParams?.get("mode");
  const loadTemplate = useBuilderStore(s => s.loadTemplate);
  const fetchDefaultImages = useBuilderStore(s => s.fetchDefaultImages);
  const setActivePage = useBuilderStore(s => s.setActivePage);

  useEffect(() => {
    if (shopId) {
      loadTemplate(shopId);
    }
    fetchDefaultImages();
  }, [shopId, loadTemplate, fetchDefaultImages]);

  // The guided onboarding wizard always starts at the first page in the sequence.
  useEffect(() => {
    if (mode === "guided") {
      setActivePage("home");
    }
  }, [mode, setActivePage]);

  return <>{children}</>;
}
