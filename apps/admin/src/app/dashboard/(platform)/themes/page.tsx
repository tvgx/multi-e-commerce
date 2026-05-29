import React from "react";
import { ComingSoonPage } from "@/components/platform/ComingSoonPage";
import { Palette } from "lucide-react";

export default function ThemesPage() {
  return (
    <ComingSoonPage 
      icon={<Palette size={40} />}
      title="Theme Market"
      description="Premium storefront templates and UI components designed to boost conversions. Browse, preview, and apply themes to your shops with a single click."
      gradientFrom="from-rose-500"
      gradientTo="to-pink-600"
    />
  );
}
