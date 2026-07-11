"use client";

import React, { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { useTranslations } from "@ecommerce/i18n/src/react";
import { apiClient } from "@/lib/api-client";

interface RowError {
  line: number;
  message: string;
}

interface ImportStatus {
  jobId: string;
  state: string;
  total: number;
  processed: number;
  errors: RowError[];
  parseErrors: RowError[];
  result: { processed: number; succeeded: number; failed: number; errors: RowError[] } | null;
  failedReason: string | null;
}

/**
 * Import sản phẩm hàng loạt (TODO 9): upload CSV/XLSX → job nền tạo sản phẩm +
 * tải ảnh từ URL về MinIO; trang poll tiến độ mỗi 2s và liệt kê lỗi từng dòng.
 */
export default function ProductImportPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const t = useTranslations("admin");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<ImportStatus | null>(null);

  // Poll tiến độ job đang chạy
  useEffect(() => {
    if (!jobId) return;
    let stopped = false;
    const poll = async () => {
      try {
        const res = await apiClient.get<ImportStatus>(`/api/catalog/products/import/${jobId}`, { shopId });
        if (stopped) return;
        setStatus(res.data);
        if (res.data.state === "completed" || res.data.state === "failed") return;
      } catch (e: any) {
        if (!stopped) setError(e.message);
        return;
      }
      if (!stopped) setTimeout(poll, 2000);
    };
    poll();
    return () => { stopped = true; };
  }, [jobId, shopId]);

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    setStatus(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiClient.post<{ jobId: string; total: number; parseErrors: RowError[] }>(
        "/api/catalog/products/import",
        form,
        { shopId },
      );
      setJobId(res.data.jobId);
    } catch (e: any) {
      setError(e.message || t("import.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const running = status && status.state !== "completed" && status.state !== "failed";
  const done = status?.state === "completed";
  const allErrors: RowError[] = [
    ...(status?.parseErrors ?? []),
    ...(status?.result?.errors ?? status?.errors ?? []),
  ].sort((a, b) => a.line - b.line);
  const progressPct = status && status.total > 0
    ? Math.round(((status.result?.processed ?? status.processed ?? 0) / status.total) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/dashboard/${shopId}/products`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} /> {t("import.backToProducts")}
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">{t("import.title")}</h1>
        <p className="text-sm text-slate-400 mt-1">{t("import.subtitle")}</p>
      </div>

      {/* Hướng dẫn + template */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
        <h2 className="font-semibold text-white">{t("import.formatTitle")}</h2>
        <p className="text-sm text-slate-400">{t("import.formatDesc")}</p>
        <ul className="text-sm text-slate-400 list-disc pl-5 space-y-1">
          <li><code className="text-indigo-300">name, price</code> — {t("import.colRequired")}</li>
          <li><code className="text-indigo-300">description, category, sku, stock, status</code> — {t("import.colOptional")}</li>
          <li><code className="text-indigo-300">images</code> — {t("import.colImages")}</li>
        </ul>
        <a
          href="/product-import-template.csv"
          download
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
        >
          <Download size={14} /> {t("import.downloadTemplate")}
        </a>
      </div>

      {/* Upload */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-white/15 rounded-2xl p-8 text-center hover:border-indigo-500/50 hover:bg-white/[0.03] transition-all"
        >
          <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-500 mb-3" />
          {file ? (
            <span className="text-sm font-medium text-white">{file.name}</span>
          ) : (
            <span className="text-sm text-slate-400">{t("import.dropHint")}</span>
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading || !!running}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-indigo-500/25 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {t("import.startButton")}
        </button>
      </div>

      {/* Tiến độ */}
      {status && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              {running && <Loader2 size={16} className="animate-spin text-indigo-400" />}
              {done && <CheckCircle2 size={16} className="text-emerald-400" />}
              {status.state === "failed" && <AlertTriangle size={16} className="text-rose-400" />}
              {running ? t("import.processing") : done ? t("import.done") : t("import.failed")}
            </h2>
            <span className="text-sm text-slate-400">
              {(status.result?.processed ?? status.processed) || 0}/{status.total}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
              style={{ width: `${done ? 100 : progressPct}%` }}
            />
          </div>
          {done && status.result && (
            <p className="text-sm text-slate-300">
              {t("import.summary", { succeeded: status.result.succeeded, failed: status.result.failed + (status.parseErrors?.length || 0) })}
            </p>
          )}
          {status.failedReason && (
            <p className="text-sm text-rose-400">{status.failedReason}</p>
          )}

          {allErrors.length > 0 && (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-2 w-24">{t("import.colLine")}</th>
                    <th className="text-left px-4 py-2">{t("import.colError")}</th>
                  </tr>
                </thead>
                <tbody>
                  {allErrors.map((e, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="px-4 py-2 text-slate-300">{e.line}</td>
                      <td className="px-4 py-2 text-rose-300">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {done && (
            <Link
              href={`/dashboard/${shopId}/products`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
            >
              {t("import.viewProducts")} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
