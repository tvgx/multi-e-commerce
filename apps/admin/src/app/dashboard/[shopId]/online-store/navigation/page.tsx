"use client";

import React, { useEffect, use } from "react";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { NavigationEditor } from "@/components/builder/NavigationEditor";

export default function NavigationPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const loadTemplate = useBuilderStore((s) => s.loadTemplate);

  useEffect(() => {
    loadTemplate(shopId);
  }, [shopId, loadTemplate]);

  return <NavigationEditor shopId={shopId} />;
}
