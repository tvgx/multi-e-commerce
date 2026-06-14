"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { schemaRegistry } from "@ecommerce/ui-registry/src/registry";
import {
  collectNavigableButtons,
  buildUrl,
  parseUrl,
  DESTINATION_PAGES,
  PAGES_WITH_SUBPAGE,
  type DestinationPage,
  type NavButtonRow,
} from "@ecommerce/ui-registry/src/lib/navigation";
import { useTranslations } from "@ecommerce/i18n/src/react";
import { toast } from "@ecommerce/ui-registry/src/store/toast-store";
import { apiClient } from "@/lib/api-client";
import { useCollections } from "@/hooks/useCollections";
import { useProducts } from "@/hooks/useProducts";
import { Loader2, Save, Link2, ExternalLink } from "lucide-react";

/**
 * Navigation / link editor. Lists every navigable button across the shop's pages
 * (and header menu) and lets the owner pick a destination page + subpage, which is
 * compiled into a URL and written back into the button's own prop, then published.
 */
export function NavigationEditor({
  shopId,
  isWizard = false,
}: {
  shopId: string;
  isWizard?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("admin");

  const pages = useBuilderStore((s) => s.pages);
  const globalComponents = useBuilderStore((s) => s.globalComponents);
  const isLoading = useBuilderStore((s) => s.isLoading);
  const setNodeProp = useBuilderStore((s) => s.setNodeProp);
  const saveTemplate = useBuilderStore((s) => s.saveTemplate);
  const publishTemplate = useBuilderStore((s) => s.publishTemplate);

  const { collections, fetchCollections } = useCollections(shopId);
  const { products, fetchProducts } = useProducts(shopId);

  const [edits, setEdits] = useState<Record<string, { pageType: DestinationPage; subSlug?: string }>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchCollections();
    fetchProducts();
  }, [fetchCollections, fetchProducts]);

  const rows = useMemo(
    () => collectNavigableButtons(pages, globalComponents, schemaRegistry),
    [pages, globalComponents],
  );

  const pageLabel = (pageKey: string) =>
    pageKey === "global" ? t("navEditor.headerLabel") : t(`builder.page.${pageKey}`);

  const selectionFor = (row: NavButtonRow) => edits[row.id] ?? parseUrl(row.currentLink);

  const setPageType = (row: NavButtonRow, pageType: DestinationPage) =>
    setEdits((prev) => ({ ...prev, [row.id]: { pageType, subSlug: "" } }));

  const setSubSlug = (row: NavButtonRow, subSlug: string) =>
    setEdits((prev) => ({ ...prev, [row.id]: { pageType: selectionFor(row).pageType, subSlug } }));

  const handleSave = async () => {
    setBusy(true);
    try {
      // Apply only rows the owner actually changed; leave the rest untouched.
      for (const row of rows) {
        const sel = edits[row.id];
        if (!sel) continue;
        const url = buildUrl(sel.pageType, sel.subSlug);
        setNodeProp(row.location, row.nodeId, row.propKey, url);
      }

      if (isWizard) {
        // Wizard: chỉ LƯU draft (đã ghi link điều hướng) rồi sang bước Billing & Shipping.
        // Việc publish/build do worker nền xử lý sau khi bấm "Lưu và Hoàn tất" ở trang đó.
        await saveTemplate(shopId);
        router.push(`/create-shop/billing-shipping?shopId=${shopId}`);
        return;
      }

      // Dashboard "Setup Menus": xuất bản ngay tại chỗ.
      await publishTemplate(shopId);
      try {
        await apiClient.patch(`/api/shops/${shopId}`, { status: "PUBLISHED" });
      } catch (err) {}
      toast.success(t("navEditor.published"));
      // Lưu + publish xong → quay về Dashboard tổng quan shop.
      router.push(`/dashboard/${shopId}`);
    } catch {
      toast.error(t("navEditor.error"));
    } finally {
      setBusy(false);
    }
  };

  const renderSubpage = (row: NavButtonRow) => {
    const sel = selectionFor(row);
    const cls =
      "w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500";

    if (sel.pageType === "collections") {
      return (
        <select className={cls} value={sel.subSlug || ""} onChange={(e) => setSubSlug(row, e.target.value)}>
          <option value="">{t("navEditor.subpage.placeholder")}</option>
          {(Array.isArray(collections) ? collections : []).map((c) => (
            <option key={c.id} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      );
    }
    if (sel.pageType === "products") {
      return (
        <select className={cls} value={sel.subSlug || ""} onChange={(e) => setSubSlug(row, e.target.value)}>
          <option value="">{t("navEditor.subpage.placeholder")}</option>
          {(Array.isArray(products) ? products : []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      );
    }
    if (sel.pageType === "pages") {
      return (
        <input
          className={cls}
          value={sel.subSlug || ""}
          placeholder="about"
          onChange={(e) => setSubSlug(row, e.target.value)}
        />
      );
    }
    if (sel.pageType === "custom") {
      return (
        <input
          className={cls}
          value={sel.subSlug || ""}
          placeholder="https://…  /  /khuyen-mai"
          onChange={(e) => setSubSlug(row, e.target.value)}
        />
      );
    }
    return <span className="text-slate-600 text-sm">—</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Link2 size={22} className="text-indigo-400" />
            {t("navEditor.title")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t("navEditor.subtitle")}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={busy || isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-indigo-500/25 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isWizard ? t("navEditor.finish") : t("navEditor.save")}
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">{t("navEditor.col.page")}</th>
                <th className="px-4 py-3 font-medium">{t("navEditor.col.section")}</th>
                <th className="px-4 py-3 font-medium">{t("navEditor.col.button")}</th>
                <th className="px-4 py-3 font-medium w-48">{t("navEditor.col.destination")}</th>
                <th className="px-4 py-3 font-medium w-56">{t("navEditor.col.subpage")}</th>
                <th className="px-4 py-3 font-medium">{t("navEditor.col.url")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {t("navEditor.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const sel = selectionFor(row);
                  const url = buildUrl(sel.pageType, sel.subSlug);
                  return (
                    <tr key={row.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 text-slate-400">{pageLabel(row.pageKey)}</td>
                      <td className="px-4 py-3">
                        <span className="text-slate-200">{row.sectionLabel}</span>
                        {row.blockLabel && (
                          <span className="ml-1.5 text-[11px] text-slate-500">/ {row.blockLabel}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{row.label}</td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                          value={sel.pageType}
                          onChange={(e) => setPageType(row, e.target.value as DestinationPage)}
                        >
                          {DESTINATION_PAGES.map((p) => (
                            <option key={p} value={p}>
                              {t(`navEditor.page.${p}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {PAGES_WITH_SUBPAGE.includes(sel.pageType) || sel.pageType === "custom" ? (
                          renderSubpage(row)
                        ) : (
                          <span className="text-slate-600 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400/80 font-mono">
                          <ExternalLink size={12} />
                          {url}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
