"use client";

import React from "react";
import { CheckCircle2, XCircle, MinusCircle, Loader2, Terminal } from "lucide-react";
import type { JestRunResult, TestCaseResult } from "@/lib/testing-api";

function statusIcon(status: string) {
  if (status === "passed") return <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />;
  if (status === "failed") return <XCircle size={15} className="shrink-0 text-red-400" />;
  return <MinusCircle size={15} className="shrink-0 text-zinc-500" />;
}

export function ResultsPanel({
  running,
  result,
  log,
  error,
}: {
  running: boolean;
  result: JestRunResult | null;
  log: string;
  error: string | null;
}) {
  const [tab, setTab] = React.useState<"results" | "console">("results");
  const logRef = React.useRef<HTMLPreElement>(null);

  React.useEffect(() => {
    if (tab === "console" && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log, tab]);

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Summary bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-3 text-sm">
          {running && <Loader2 size={15} className="animate-spin text-indigo-400" />}
          {result && (
            <>
              <span className="text-emerald-400">{result.numPassed} passed</span>
              {result.numFailed > 0 && <span className="text-red-400">{result.numFailed} failed</span>}
              <span className="text-zinc-500">/ {result.numTotal} total</span>
              <span className="text-zinc-600">· {(result.durationMs / 1000).toFixed(2)}s</span>
            </>
          )}
          {!running && !result && !error && (
            <span className="text-zinc-500">Chọn một suite và bấm Run.</span>
          )}
          {error && <span className="text-red-400">{error}</span>}
        </div>
        <div className="flex gap-1 text-xs">
          {(["results", "console"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded px-2 py-1 ${
                tab === t ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t === "results" ? "Kết quả" : "Console"}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "results" ? (
          <ResultList result={result} running={running} />
        ) : (
          <pre
            ref={logRef}
            className="h-full overflow-auto whitespace-pre-wrap p-3 font-mono text-xs leading-relaxed text-zinc-400"
          >
            {log || (
              <span className="text-zinc-600">
                <Terminal size={12} className="mr-1 inline" /> Output của jest sẽ hiện ở đây…
              </span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}

function ResultList({ result, running }: { result: JestRunResult | null; running: boolean }) {
  if (!result) {
    return (
      <div className="p-4 text-sm text-zinc-600">
        {running ? "Đang chạy…" : "Chưa có kết quả."}
      </div>
    );
  }
  return (
    <div className="divide-y divide-zinc-900">
      {result.suites.map((s) => (
        <div key={s.file} className="py-1">
          <div className="px-3 py-1 font-mono text-xs text-zinc-500">{s.file}</div>
          {s.tests.map((t, i) => (
            <TestRow key={`${s.file}-${i}`} test={t} />
          ))}
        </div>
      ))}
      {result.suites.length === 0 && (
        <div className="p-4 text-sm text-red-400">
          Không parse được kết quả jest. Xem tab Console để biết chi tiết.
        </div>
      )}
    </div>
  );
}

function TestRow({ test }: { test: TestCaseResult }) {
  const [open, setOpen] = React.useState(false);
  const hasError = test.failureMessages.length > 0;
  return (
    <div>
      <button
        onClick={() => hasError && setOpen((o) => !o)}
        className={`flex w-full items-start gap-2 px-4 py-1 text-left text-sm ${
          hasError ? "cursor-pointer hover:bg-zinc-900" : "cursor-default"
        }`}
      >
        {statusIcon(test.status)}
        <span className={test.status === "failed" ? "text-red-300" : "text-zinc-300"}>
          {test.title}
        </span>
        {test.durationMs > 0 && (
          <span className="ml-auto shrink-0 text-xs text-zinc-600">{test.durationMs}ms</span>
        )}
      </button>
      {open && hasError && (
        <pre className="mx-4 mb-2 overflow-auto rounded bg-red-950/30 p-2 font-mono text-xs text-red-300">
          {test.failureMessages.join("\n\n")}
        </pre>
      )}
    </div>
  );
}
