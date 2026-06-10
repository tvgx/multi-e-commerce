"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const shopId = searchParams?.get("shopId") || "";
  const loadTemplate = useBuilderStore(s => s.loadTemplate);
  const fetchDefaultImages = useBuilderStore(s => s.fetchDefaultImages);

  useEffect(() => {
    if (shopId) {
      loadTemplate(shopId);
    }
    fetchDefaultImages();
  }, [shopId, loadTemplate, fetchDefaultImages]);

  return <>{children}</>;
}
