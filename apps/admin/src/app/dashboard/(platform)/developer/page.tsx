import React from "react";
import { ComingSoonPage } from "@/components/platform/ComingSoonPage";
import { TestingTool } from "@/components/testing/TestingTool";
import { Code2 } from "lucide-react";
import { getT } from "@/lib/i18n";

// Dev-only: the Developer area hosts the in-app Testing Tool (Jest + HTTP runner
// with a live code editor). In production the backend `testing` module is not
// even mounted, so we fall back to the marketing "Coming Soon" placeholder.
export default async function DeveloperPage() {
  if (process.env.NODE_ENV !== "production") {
    return <TestingTool />;
  }
  const t = await getT("admin");
  return (
    <ComingSoonPage
      icon={<Code2 size={40} />}
      title={t("developerPage.title")}
      description={t("developerPage.description")}
      gradientFrom="from-zinc-500"
      gradientTo="to-zinc-700"
    />
  );
}
