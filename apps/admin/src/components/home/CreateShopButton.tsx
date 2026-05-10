"use client";

import { Rocket, ArrowRight } from "lucide-react";
import { useCheckAuth } from "@/hooks/useCheckAuth";

interface CreateShopButtonProps {
  variant?: "primary" | "secondary";
  className?: string;
  children?: React.ReactNode;
}

export function CreateShopButton({ variant = "primary", className, children }: CreateShopButtonProps) {
  const { checkAndNavigate } = useCheckAuth();

  if (variant === "secondary") {
    return (
      <button
        onClick={() => checkAndNavigate("/create-shop")}
        className={className || "group relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"}
      >
        {children || "Start Free Trial"}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    );
  }

  return (
    <button
      onClick={() => checkAndNavigate("/create-shop")}
      className={className || "w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-base font-bold text-white transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-105 ring-1 ring-white/10"}
    >
      {children || "Tạo cửa hàng của bạn"}
      <Rocket className="w-5 h-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
    </button>
  );
}
