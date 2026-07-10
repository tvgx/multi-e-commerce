"use client";

import React, { useState, useRef, useEffect } from "react";
import { useBuilderStore, EDITABLE_PAGES } from "@ecommerce/ui-registry/src/store/builder-store";
import { ChevronDown, FileText, Check } from "lucide-react";
import { useTranslations } from "@ecommerce/i18n/src/react";

/**
 * Plain-language page picker for the storefront builder. Lets a non-technical
 * shop owner switch between the pages they can customise (Home, Product listing,
 * Product detail) without knowing the underlying page-type keys.
 */
export function PageSwitcher({ variant = "dark" }: { variant?: "dark" | "light" }) {
    const t = useTranslations("admin");
    const activePage = useBuilderStore((s) => s.activePage);
    const setActivePage = useBuilderStore((s) => s.setActivePage);
    const setActiveComponent = useBuilderStore((s) => s.setActiveComponent);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const current = EDITABLE_PAGES.find((p) => p.key === activePage) ?? EDITABLE_PAGES[0];
    const isDark = variant === "dark";

    const handleSelect = (key: string) => {
        setActivePage(key);
        setActiveComponent(null); // clear selection when leaving a page
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                title={t("builderTool.selectPageToEdit")}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isDark
                        ? "bg-slate-800 text-white hover:bg-slate-700"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
            >
                <FileText size={14} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
                <span className="max-w-[200px] truncate">{current.label}</span>
                <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div
                    className={`absolute left-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-xl border shadow-xl ${
                        isDark ? "border-white/10 bg-[#0c0c14]" : "border-gray-200 bg-white"
                    }`}
                >
                    <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                        {t("builderTool.pageToCustomize")}
                    </div>
                    {EDITABLE_PAGES.map((page) => {
                        const selected = page.key === activePage;
                        return (
                            <button
                                key={page.key}
                                onClick={() => handleSelect(page.key)}
                                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                                    isDark
                                        ? selected ? "bg-indigo-500/15" : "hover:bg-white/5"
                                        : selected ? "bg-indigo-50" : "hover:bg-gray-50"
                                }`}
                            >
                                <div className={`mt-0.5 shrink-0 ${selected ? (isDark ? "text-indigo-400" : "text-indigo-600") : isDark ? "text-slate-600" : "text-gray-300"}`}>
                                    {selected ? <Check size={15} /> : <FileText size={15} />}
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-sm font-medium ${isDark ? (selected ? "text-indigo-300" : "text-slate-200") : (selected ? "text-indigo-700" : "text-gray-800")}`}>
                                        {page.label}
                                    </div>
                                    <div className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>{page.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
