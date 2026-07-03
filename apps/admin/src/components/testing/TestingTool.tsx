"use client";

import React from "react";
import { FlaskConical, Play, Save, RefreshCw, Loader2, Globe, TestTube2 } from "lucide-react";
import { SuiteTree, type SuiteStatus } from "./SuiteTree";
import { CodeEditor } from "./CodeEditor";
import { ResultsPanel } from "./ResultsPanel";
import { HttpScenarioPanel } from "./HttpScenarioPanel";
import {
  fetchSuites,
  readFile,
  writeFile,
  runJestStream,
  type SuiteInfo,
  type HttpScenario,
  type JestRunResult,
} from "@/lib/testing-api";

export function TestingTool() {
  const [suites, setSuites] = React.useState<SuiteInfo[]>([]);
  const [scenarios, setScenarios] = React.useState<HttpScenario[]>([]);
  const [loadErr, setLoadErr] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"jest" | "http">("jest");

  const [selected, setSelected] = React.useState<string | null>(null);
  const [content, setContent] = React.useState("");
  const [savedContent, setSavedContent] = React.useState("");
  const [loadingFile, setLoadingFile] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [statuses, setStatuses] = React.useState<Record<string, SuiteStatus>>({});
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<JestRunResult | null>(null);
  const [log, setLog] = React.useState("");
  const [runError, setRunError] = React.useState<string | null>(null);
  const cancelRef = React.useRef<(() => void) | null>(null);

  const dirty = content !== savedContent;

  React.useEffect(() => {
    fetchSuites()
      .then(({ suites, scenarios }) => {
        setSuites(suites);
        setScenarios(scenarios);
      })
      .catch((e) => setLoadErr(e?.message ?? "Không tải được danh sách suite"));
    return () => cancelRef.current?.();
  }, []);

  async function selectSuite(specPath: string) {
    setSelected(specPath);
    setLoadingFile(true);
    try {
      const { content } = await readFile(specPath);
      setContent(content);
      setSavedContent(content);
    } catch (e: any) {
      setContent(`// Không đọc được file: ${e?.message ?? ""}`);
      setSavedContent("");
    } finally {
      setLoadingFile(false);
    }
  }

  function runJest(specPath?: string) {
    cancelRef.current?.();
    setRunning(true);
    setResult(null);
    setRunError(null);
    setLog("");
    // Mark affected suites as running.
    setStatuses((s) => {
      const next = { ...s };
      if (specPath) next[specPath] = "running";
      else for (const su of suites) next[su.specPath] = "running";
      return next;
    });

    cancelRef.current = runJestStream(
      { specPath },
      {
        onLog: (chunk) => setLog((l) => l + chunk),
        onResult: (res) => {
          setResult(res);
          setRunning(false);
          setStatuses((s) => {
            const next = { ...s };
            if (res.suites.length > 0) {
              for (const su of res.suites) {
                const failed = su.tests.some((t) => t.status === "failed") || su.status === "failed";
                next[su.file] = failed ? "failed" : "passed";
              }
            } else if (specPath) {
              next[specPath] = res.ok ? "passed" : "failed";
            }
            return next;
          });
        },
        onError: (msg) => {
          setRunError(msg);
          setRunning(false);
          setStatuses((s) => {
            const next = { ...s };
            for (const k of Object.keys(next)) if (next[k] === "running") next[k] = "idle";
            return next;
          });
        },
      }
    );
  }

  async function saveAndRun() {
    if (!selected) return;
    setSaving(true);
    try {
      await writeFile(selected, content);
      setSavedContent(content);
      setSaving(false);
      runJest(selected);
    } catch (e: any) {
      setSaving(false);
      setRunError(e?.message ?? "Lưu thất bại");
    }
  }

  if (loadErr) {
    return (
      <div className="p-8 text-sm text-red-400">
        Không kết nối được test runner: {loadErr}
        <div className="mt-2 text-zinc-500">
          Đảm bảo api-core đang chạy (dev) và NODE_ENV ≠ production.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2.5">
        <FlaskConical size={18} className="text-indigo-400" />
        <h1 className="text-sm font-semibold">Testing Tool</h1>
        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
          dev only
        </span>
        <div className="ml-4 flex rounded-lg bg-zinc-900 p-0.5 text-xs">
          <TabButton active={tab === "jest"} onClick={() => setTab("jest")} icon={<TestTube2 size={13} />}>
            Unit / Integration (Jest)
          </TabButton>
          <TabButton active={tab === "http"} onClick={() => setTab("http")} icon={<Globe size={13} />}>
            API (HTTP)
          </TabButton>
        </div>
        {tab === "jest" && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => runJest()}
              disabled={running}
              className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              {running ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Run all
            </button>
            <button
              onClick={saveAndRun}
              disabled={!selected || saving || running}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Save &amp; Run{dirty ? " *" : ""}
            </button>
          </div>
        )}
      </header>

      {/* Body */}
      {tab === "jest" ? (
        <div className="flex min-h-0 flex-1">
          {/* Left: suite tree */}
          <aside className="w-72 shrink-0 overflow-auto border-r border-zinc-800">
            <SuiteTree
              suites={suites}
              selected={selected}
              statuses={statuses}
              onSelect={selectSuite}
              onRun={(spec) => {
                if (selected !== spec) selectSuite(spec);
                runJest(spec);
              }}
            />
          </aside>

          {/* Center: editor */}
          <section className="flex min-w-0 flex-1 flex-col border-r border-zinc-800">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-1.5">
              <span className="truncate font-mono text-xs text-zinc-400">
                {selected ?? "Chọn một suite bên trái để xem & sửa code"}
              </span>
              {selected && (
                <button
                  onClick={() => runJest(selected)}
                  disabled={running}
                  className="ml-auto flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Play size={12} /> Run suite
                </button>
              )}
            </div>
            <div className="min-h-0 flex-1">
              {selected ? (
                loadingFile ? (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    <Loader2 size={16} className="mr-2 animate-spin" /> Đang tải file…
                  </div>
                ) : (
                  <CodeEditor path={selected} value={content} onChange={setContent} />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-600">
                  Chưa chọn suite.
                </div>
              )}
            </div>
          </section>

          {/* Right: results */}
          <section className="w-[34%] min-w-[320px] shrink-0">
            <ResultsPanel running={running} result={result} log={log} error={runError} />
          </section>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <HttpScenarioPanel scenarios={scenarios} />
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 ${
        active ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
