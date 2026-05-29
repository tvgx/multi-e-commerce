import React from "react";
import { ComingSoonPage } from "@/components/platform/ComingSoonPage";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <ComingSoonPage 
      icon={<CreditCard size={40} />}
      title="Billing & Plans"
      description="Manage your platform subscription, view invoices, and upgrade features. Scale your business with flexible pricing tailored to your needs."
      gradientFrom="from-violet-500"
      gradientTo="to-purple-600"
    />
  );
}
