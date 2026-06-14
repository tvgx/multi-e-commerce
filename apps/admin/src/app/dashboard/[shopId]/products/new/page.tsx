"use client";

import React, { use } from "react";
import { ProductForm } from "@/components/ProductForm";
import { useOnboardingAutoNav } from "@/hooks/useOnboardingAutoNav";

export default function NewProductPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);

  const { completeAndNavigate } = useOnboardingAutoNav({
    shopId,
    currentStep: 2,
    nextRoute: `/dashboard/${shopId}/collections`,
  });

  return (
    <ProductForm mode="create" shopId={shopId} onSuccess={completeAndNavigate} />
  );
}
