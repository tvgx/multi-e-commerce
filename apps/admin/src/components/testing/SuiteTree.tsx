"use client";

import React from "react";
import { ChevronRight, ChevronDown, Play, FileCode2, Loader2 } from "lucide-react";
import type { SuiteInfo } from "@/lib/testing-api";
import { useTranslations } from "@ecommerce/i18n/src/react";

export type SuiteStatus = "idle" | "running" | "passed" | "failed";

export function SuiteTree({
  suites,
  selected,
  statuses,
  onSelect,
  onRun,
}: {
  suites: SuiteInfo[];
  selected: string | null;
  statuses: Record<string, SuiteStatus>;
  onSelect: (specPath: string) => void;
  onRun: (specPath: string) => void;
}) {
  const t = useTranslations("admin");
  const flows = React.useMemo(() => {
    const map = new Map<string, SuiteInfo[]>();
    for (const s of suites) {
      const key = s.flow;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [suites]);

  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  return (
    <div className="text-sm">
      {flows.map(([flow, list]) => {
        const isCollapsed = collapsed[flow];
        const documented = list.some((s) => s.thesisCodes.length > 0);
        return (
          <div key={flow}>
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [flow]: !c[flow] }))}
              className="flex w-full items-center gap-1 px-2 py-1.5 text-left font-semibold text-zinc-300 hover:bg-zinc-900"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <span className="capitalize">{flow}</span>
              {documented && (
                <span className="ml-1 rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
                  {t("testingTool.thesisBadge")}
                </span>
              )}
              <span className="ml-auto text-xs font-normal text-zinc-600">{list.length}</span>
            </button>
            {!isCollapsed &&
              list.map((s) => (
                <SuiteRow
                  key={s.specPath}
                  suite={s}
                  active={selected === s.specPath}
                  status={statuses[s.specPath] ?? "idle"}
                  onSelect={() => onSelect(s.specPath)}
                  onRun={() => onRun(s.specPath)}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}

function statusDot(status: SuiteStatus) {
  if (status === "running") return <Loader2 size={13} className="animate-spin text-indigo-400" />;
  if (status === "passed") return <span className="h-2 w-2 rounded-full bg-emerald-400" />;
  if (status === "failed") return <span className="h-2 w-2 rounded-full bg-red-400" />;
  return <span className="h-2 w-2 rounded-full bg-zinc-700" />;
}

function SuiteRow({
  suite,
  active,
  status,
  onSelect,
  onRun,
}: {
  suite: SuiteInfo;
  active: boolean;
  status: SuiteStatus;
  onSelect: () => void;
  onRun: () => void;
}) {
  return (
    <div
      className={`group flex flex-col gap-1 border-l-2 py-1.5 pl-6 pr-2 ${
        active ? "border-indigo-500 bg-zinc-900/70" : "border-transparent hover:bg-zinc-900/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex w-3 justify-center">{statusDot(status)}</span>
        <button onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          <FileCode2 size={13} className="shrink-0 text-zinc-500" />
          <span className="truncate text-zinc-300">{suite.title}</span>
          <span className="shrink-0 text-xs text-zinc-600">({suite.cases.length})</span>
        </button>
        <button
          onClick={onRun}
          title="Run suite"
          className="rounded p-1 text-zinc-500 opacity-0 hover:bg-zinc-800 hover:text-emerald-400 group-hover:opacity-100"
        >
          <Play size={13} />
        </button>
      </div>
      {suite.thesisCodes.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-5">
          {suite.thesisCodes.map((c) => (
            <span
              key={c.code}
              title={c.scenario}
              className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400"
            >
              {c.code}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
