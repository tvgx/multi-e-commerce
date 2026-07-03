import React from "react";
import { ComingSoonPage } from "@/components/platform/ComingSoonPage";
import { TestingTool } from "@/components/testing/TestingTool";
import { Code2 } from "lucide-react";

// Dev-only: the Developer area hosts the in-app Testing Tool (Jest + HTTP runner
// with a live code editor). In production the backend `testing` module is not
// even mounted, so we fall back to the marketing "Coming Soon" placeholder.
export default function DeveloperPage() {
  if (process.env.NODE_ENV !== "production") {
    return <TestingTool />;
  }
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
