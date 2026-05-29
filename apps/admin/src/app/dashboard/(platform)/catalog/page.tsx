import React from "react";
import { ComingSoonPage } from "@/components/platform/ComingSoonPage";
import { Package } from "lucide-react";

export default function CatalogPage() {
  return (
    <ComingSoonPage 
      icon={<Package size={40} />}
      title="Product Catalog"
      description="Centralized product management. Create and manage your products once, then distribute them to any of your multiple storefronts seamlessly."
      gradientFrom="from-emerald-500"
      gradientTo="to-teal-600"
    />
  );
}
