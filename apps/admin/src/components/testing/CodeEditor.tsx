"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "@ecommerce/i18n/src/react";

function EditorLoading() {
  const t = useTranslations("admin");
  return (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      {t("testingTool.loadingEditor")}
    </div>
  );
}

// Monaco is client-only and heavy — load it lazily. This page is dev-only so the
// bundle never ships to production.
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorLoading />,
});

function languageFor(path: string): string {
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  return "typescript";
}

export function CodeEditor({
  path,
  value,
  onChange,
}: {
  path: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <MonacoEditor
      height="100%"
      theme="vs-dark"
      language={languageFor(path)}
      path={path}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      options={{
        fontSize: 13,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        quickSuggestions: true,
      }}
    />
  );
}
