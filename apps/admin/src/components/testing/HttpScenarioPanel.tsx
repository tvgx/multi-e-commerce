"use client";

import React from "react";
import { Play, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import { runHttpScenario, type HttpScenario, type HttpRunResult } from "@/lib/testing-api";
import { useTranslations } from "@ecommerce/i18n/src/react";

type RunState = { status: "idle" | "running" | "passed" | "failed"; result?: HttpRunResult };

export function HttpScenarioPanel({ scenarios }: { scenarios: HttpScenario[] }) {
  const t = useTranslations("admin");
  const [selectedId, setSelectedId] = React.useState<string | null>(scenarios[0]?.id ?? null);
  // Editable JSON per scenario (keyed by id), seeded from the catalog.
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [states, setStates] = React.useState<Record<string, RunState>>({});

  const draftFor = (s: HttpScenario) => drafts[s.id] ?? JSON.stringify(s, null, 2);

  async function run(s: HttpScenario) {
    let scenario: HttpScenario;
    try {
      scenario = JSON.parse(draftFor(s));
    } catch {
      setStates((st) => ({
        ...st,
        [s.id]: { status: "failed", result: { ok: false, actualStatus: 0, actualBody: t("testingTool.invalidJson"), checks: [] } },
      }));
      return;
    }
    setStates((st) => ({ ...st, [s.id]: { status: "running" } }));
    try {
      const result = await runHttpScenario(scenario);
      setStates((st) => ({ ...st, [s.id]: { status: result.ok ? "passed" : "failed", result } }));
    } catch (e: any) {
      setStates((st) => ({
        ...st,
        [s.id]: { status: "failed", result: { ok: false, actualStatus: 0, actualBody: e?.message ?? t("testingTool.genericError"), checks: [] } },
      }));
    }
  }

  async function runAll() {
    for (const s of scenarios) await run(s);
  }

  const selected = scenarios.find((s) => s.id === selectedId) ?? null;
  const selState = selected ? states[selected.id] : undefined;

  return (
    <div className="flex h-full">
      {/* Scenario list */}
      <div className="flex w-72 shrink-0 flex-col border-r border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Scenarios</span>
          <button
            onClick={runAll}
            className="flex items-center gap-1 rounded bg-emerald-600/90 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-600"
          >
            <Play size={12} /> Run all
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {scenarios.map((s) => {
            const st = states[s.id]?.status ?? "idle";
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`flex w-full flex-col gap-1 border-l-2 px-3 py-2 text-left ${
                  selectedId === s.id ? "border-indigo-500 bg-zinc-900/70" : "border-transparent hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={st} />
                  <span className="truncate text-sm text-zinc-300">{s.title}</span>
                </div>
                <div className="flex items-center gap-2 pl-5">
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                    {s.method}
                  </span>
                  {s.code && (
                    <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] text-indigo-300">
                      {s.code}
                    </span>
                  )}
                  {s.note && <AlertTriangle size={11} className="text-amber-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor + result */}
      {selected ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
            <span className="truncate font-mono text-xs text-zinc-400">
              {selected.method} {selected.path}
            </span>
            <button
              onClick={() => run(selected)}
              disabled={selState?.status === "running"}
              className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {selState?.status === "running" ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              Run
            </button>
          </div>
          {selected.note && (
            <div className="flex items-start gap-2 border-b border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{selected.note}</span>
            </div>
          )}
          <div className="min-h-0 flex-1">
            <CodeEditor
              path={`scenario-${selected.id}.json`}
              value={draftFor(selected)}
              onChange={(v) => setDrafts((d) => ({ ...d, [selected.id]: v }))}
            />
          </div>
          <ScenarioResult state={selState} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">
          {t("testingTool.noScenario")}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: RunState["status"] }) {
  if (status === "running") return <Loader2 size={13} className="animate-spin text-indigo-400" />;
  if (status === "passed") return <CheckCircle2 size={13} className="text-emerald-400" />;
  if (status === "failed") return <XCircle size={13} className="text-red-400" />;
  return <span className="h-2 w-2 rounded-full bg-zinc-700" />;
}

function ScenarioResult({ state }: { state?: RunState }) {
  if (!state || !state.result) return null;
  const r = state.result;
  return (
    <div className="max-h-56 shrink-0 overflow-auto border-t border-zinc-800 bg-zinc-950 p-3 text-xs">
      <div className="mb-2 flex items-center gap-3">
        <span className={r.ok ? "text-emerald-400" : "text-red-400"}>
          {r.ok ? "PASS" : "FAIL"}
        </span>
        <span className="text-zinc-500">HTTP {r.actualStatus}</span>
      </div>
      <div className="space-y-1">
        {r.checks.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            {c.ok ? (
              <CheckCircle2 size={12} className="text-emerald-400" />
            ) : (
              <XCircle size={12} className="text-red-400" />
            )}
            <span className="text-zinc-400">{c.name}</span>
            {!c.ok && <span className="text-zinc-600">→ {JSON.stringify(c.actual)}</span>}
          </div>
        ))}
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-zinc-500">Response body</summary>
        <pre className="mt-1 whitespace-pre-wrap font-mono text-zinc-400">
          {JSON.stringify(r.actualBody, null, 2)}
        </pre>
      </details>
    </div>
  );
}
