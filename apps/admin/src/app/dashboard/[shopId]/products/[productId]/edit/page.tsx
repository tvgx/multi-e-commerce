"use client";

import React, { use } from "react";
import { ProductForm } from "@/components/ProductForm";

export default function EditProductPage({ params }: { params: Promise<{ shopId: string, productId: string }> }) {
  const { shopId, productId } = use(params);

  return (
    <ProductForm mode="edit" shopId={shopId} productId={productId} />
  );
}
