"use client";

import React, { Suspense } from "react";
import PaymentConfirmationContent from "./PaymentConfirmationContent";
import { Loader2 } from "lucide-react";

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
    }>
      <PaymentConfirmationContent />
    </Suspense>
  );
}
