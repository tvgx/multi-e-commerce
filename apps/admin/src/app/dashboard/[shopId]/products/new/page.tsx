"use client";

import React, { use } from "react";
import { ProductForm } from "@/components/ProductForm";

export default function NewProductPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);

  return (
    <ProductForm mode="create" shopId={shopId} />
  );
}
