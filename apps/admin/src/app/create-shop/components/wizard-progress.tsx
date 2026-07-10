"use client";

import React from "react";
import { Check } from "lucide-react";
import { useTranslations } from "@ecommerce/i18n/src/react";

export type WizardStepKey = "design" | "navigation" | "billing";

// Các bước lớn của wizard tạo shop — hiển thị đồng bộ ở mọi trang trong flow.
const STEPS: { key: WizardStepKey; labelKey: string }[] = [
  { key: "design", labelKey: "wizard.stepDesign" },
  { key: "navigation", labelKey: "wizard.stepNavigation" },
  { key: "billing", labelKey: "wizard.stepBilling" },
];

export function WizardProgress({ current }: { current: WizardStepKey }) {
  const t = useTranslations("admin");
  const activeIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-indigo-600 text-white ring-4 ring-indigo-500/30"
                      : "bg-slate-900 border border-white/10 text-slate-500"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span
                className={`hidden sm:inline text-xs font-medium ${
                  active ? "text-white" : done ? "text-emerald-300" : "text-slate-500"
                }`}
              >
                {t(s.labelKey)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-6 sm:w-12 rounded-full transition-all ${
                  i < activeIdx ? "bg-emerald-500" : "bg-white/10"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
