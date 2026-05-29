import React from "react";
import { ComingSoonPage } from "@/components/platform/ComingSoonPage";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <ComingSoonPage 
      icon={<BarChart3 size={40} />}
      title="Analytics Hub"
      description="Aggregated insights across all your storefronts. Track revenue, traffic, sales funnels, and customer behavior in one centralized dashboard."
      gradientFrom="from-blue-500"
      gradientTo="to-indigo-600"
    />
  );
}
