/**
 * Client for the dev-only in-app test runner (api-core `/api/testing/*`).
 * JSON calls reuse the shared apiClient; Jest runs use SSE for live logs.
 */
import { apiClient } from "./api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface ThesisCode {
  code: string;
  scenario: string;
}

export interface SuiteInfo {
  specPath: string;
  flow: string;
  title: string;
  cases: { title: string; ancestorTitles: string[] }[];
  thesisCodes: ThesisCode[];
}

export interface HttpScenario {
  id: string;
  code?: string;
  title: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  expect: { status?: number; jsonPath?: string; equals?: unknown };
  note?: string;
}

export interface TestCaseResult {
  fullName: string;
  title: string;
  ancestorTitles: string[];
  status: string;
  durationMs: number;
  failureMessages: string[];
}

export interface JestRunResult {
  ok: boolean;
  numPassed: number;
  numFailed: number;
  numTotal: number;
  durationMs: number;
  suites: { file: string; status: string; tests: TestCaseResult[] }[];
  tests: TestCaseResult[];
  rawOutput: string;
  exitCode: number | null;
}

export interface HttpRunResult {
  ok: boolean;
  actualStatus: number;
  actualBody: unknown;
  checks: { name: string; ok: boolean; actual: unknown }[];
}

export async function fetchSuites(): Promise<{ suites: SuiteInfo[]; scenarios: HttpScenario[] }> {
  const res = await apiClient.get<{ suites: SuiteInfo[]; scenarios: HttpScenario[] }>(
    "/api/testing/suites"
  );
  return res.data;
}

export async function readFile(path: string): Promise<{ path: string; content: string }> {
  const res = await apiClient.get<{ path: string; content: string }>(
    `/api/testing/file?path=${encodeURIComponent(path)}`
  );
  return res.data;
}

export async function writeFile(path: string, content: string): Promise<{ path: string; bytes: number }> {
  const res = await apiClient.put<{ path: string; bytes: number }>("/api/testing/file", { path, content });
  return res.data;
}

export async function runHttpScenario(scenario: HttpScenario): Promise<HttpRunResult> {
  const res = await apiClient.post<HttpRunResult>("/api/testing/run/http", scenario);
  return res.data;
}

/**
 * Run jest via SSE. Calls `onLog` for each live chunk and resolves with the
 * final structured result. Returns a `cancel` fn to abort the stream.
 */
export function runJestStream(
  opts: { specPath?: string; testNamePattern?: string },
  handlers: {
    onLog?: (chunk: string) => void;
    onResult?: (result: JestRunResult) => void;
    onError?: (message: string) => void;
  }
): () => void {
  const params = new URLSearchParams();
  if (opts.specPath) params.set("spec", opts.specPath);
  if (opts.testNamePattern) params.set("t", opts.testNamePattern);
  const url = `${API_BASE}/api/testing/run/jest/stream?${params.toString()}`;
  const es = new EventSource(url, { withCredentials: true });

  es.addEventListener("log", (e) => {
    try {
      const { chunk } = JSON.parse((e as MessageEvent).data);
      handlers.onLog?.(chunk);
    } catch {
      /* ignore */
    }
  });
  es.addEventListener("result", (e) => {
    try {
      handlers.onResult?.(JSON.parse((e as MessageEvent).data));
    } catch {
      handlers.onError?.("Failed to parse result");
    }
    es.close();
  });
  es.addEventListener("error", (e) => {
    // Distinguish a server-sent `error` event (has data) from a transport drop.
    const data = (e as MessageEvent).data;
    if (data) {
      try {
        handlers.onError?.(JSON.parse(data).message);
      } catch {
        handlers.onError?.("Test run failed");
      }
    } else {
      handlers.onError?.("Connection to test runner lost");
    }
    es.close();
  });

  return () => es.close();
}
