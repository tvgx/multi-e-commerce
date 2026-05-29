import React from "react";
import { ComingSoonPage } from "@/components/platform/ComingSoonPage";
import { Code2 } from "lucide-react";

export default function DeveloperPage() {
  return (
    <ComingSoonPage 
      icon={<Code2 size={40} />}
      title="Developer API"
      description="Powerful APIs, webhooks, and comprehensive documentation to build custom integrations and extend the OmniCommerce platform."
      gradientFrom="from-zinc-500"
      gradientTo="to-zinc-700"
    />
  );
}
