import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { promises as fs, existsSync } from 'fs';
import * as path from 'path';
import { THESIS_CODES, HTTP_SCENARIOS, HttpScenario, ThesisCode } from './testing.catalog';

const READABLE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);
const WRITABLE_ROOTS = ['src', 'test'];
const JEST_TIMEOUT_MS = 180_000;
const RAW_LOG_CAP = 12_000;

export interface TestCaseResult {
  fullName: string;
  title: string;
  ancestorTitles: string[];
  status: string; // passed | failed | pending | skipped | todo
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

export interface SuiteInfo {
  specPath: string;
  flow: string;
  title: string;
  cases: { title: string; ancestorTitles: string[] }[];
  thesisCodes: ThesisCode[];
}

@Injectable()
export class TestingService {
  private readonly logger = new Logger('TestingService');
  /** Absolute path to the api-core package root (holds jest.config.js). */
  private readonly root = TestingService.resolveApiCoreRoot();

  private static resolveApiCoreRoot(): string {
    const candidates = [
      path.resolve(__dirname, '../../..'), // dist/modules/testing -> apps/api-core
      path.resolve(__dirname, '../../../..'),
      process.cwd(),
    ];
    for (const c of candidates) {
      if (existsSync(path.join(c, 'jest.config.js'))) return c;
    }
    return process.cwd();
  }

  // ---------------------------------------------------------------- paths

  /** Resolve a repo-relative path, jailed to the api-core root. */
  private safeResolve(rel: string, opts: { write: boolean }): string {
    if (!rel || typeof rel !== 'string') {
      throw new BadRequestException('path is required');
    }
    const abs = path.resolve(this.root, rel);
    const rootWithSep = this.root.endsWith(path.sep) ? this.root : this.root + path.sep;
    if (abs !== this.root && !abs.startsWith(rootWithSep)) {
      throw new BadRequestException('Path escapes project root');
    }
    if (abs.split(path.sep).includes('node_modules')) {
      throw new BadRequestException('node_modules is not accessible');
    }
    if (!READABLE_EXT.has(path.extname(abs))) {
      throw new BadRequestException('Only .ts/.tsx/.js/.jsx/.json files are allowed');
    }
    if (opts.write) {
      const relFromRoot = path.relative(this.root, abs);
      const topDir = relFromRoot.split(path.sep)[0];
      if (!WRITABLE_ROOTS.includes(topDir)) {
        throw new BadRequestException(`Writes are only allowed under: ${WRITABLE_ROOTS.join(', ')}`);
      }
    }
    return abs;
  }

  private toRel(abs: string): string {
    return path.relative(this.root, abs).split(path.sep).join('/');
  }

  async readFile(rel: string): Promise<{ path: string; content: string }> {
    const abs = this.safeResolve(rel, { write: false });
    try {
      const content = await fs.readFile(abs, 'utf8');
      return { path: this.toRel(abs), content };
    } catch {
      throw new NotFoundException(`File not found: ${rel}`);
    }
  }

  async writeFile(rel: string, content: string): Promise<{ path: string; bytes: number }> {
    if (typeof content !== 'string') {
      throw new BadRequestException('content must be a string');
    }
    const abs = this.safeResolve(rel, { write: true });
    if (!existsSync(abs)) {
      throw new NotFoundException(`Refusing to create a new file: ${rel}`);
    }
    await fs.writeFile(abs, content, 'utf8');
    this.logger.warn(`Test runner wrote ${Buffer.byteLength(content)} bytes to ${this.toRel(abs)}`);
    return { path: this.toRel(abs), bytes: Buffer.byteLength(content) };
  }

  // ---------------------------------------------------------------- suites

  private async walkSpecs(dir: string, acc: string[] = []): Promise<string[]> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return acc;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === 'archive-v1' || e.name === 'dist') continue;
        await this.walkSpecs(full, acc);
      } else if (/\.(spec|test)\.tsx?$/.test(e.name)) {
        acc.push(full);
      }
    }
    return acc;
  }

  /** Best-effort extraction of it()/test() titles via regex. */
  private parseTestTitles(content: string): { title: string; ancestorTitles: string[] }[] {
    const out: { title: string; ancestorTitles: string[] }[] = [];
    const re = /\b(?:it|test)(?:\.(?:only|skip|todo))?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      out.push({ title: m[2].replace(/\\(['"`])/g, '$1'), ancestorTitles: [] });
    }
    return out;
  }

  private inferFlow(rel: string): string {
    const m = rel.match(/modules\/([^/]+)\//);
    return m ? m[1] : 'other';
  }

  async listSuites(): Promise<{ suites: SuiteInfo[]; scenarios: HttpScenario[] }> {
    const srcRoot = path.join(this.root, 'src');
    const files = await this.walkSpecs(srcRoot);
    const suites: SuiteInfo[] = await Promise.all(
      files.map(async (abs) => {
        const rel = this.toRel(abs);
        let content = '';
        try {
          content = await fs.readFile(abs, 'utf8');
        } catch {
          /* ignore */
        }
        const meta = THESIS_CODES[rel];
        return {
          specPath: rel,
          flow: meta?.flow ?? this.inferFlow(rel),
          title: path.basename(rel),
          cases: this.parseTestTitles(content),
          thesisCodes: meta?.codes ?? [],
        };
      }),
    );
    // Documented flows first, then the rest; alphabetical within.
    suites.sort((a, b) => {
      const da = a.thesisCodes.length ? 0 : 1;
      const db = b.thesisCodes.length ? 0 : 1;
      if (da !== db) return da - db;
      return a.specPath.localeCompare(b.specPath);
    });
    return { suites, scenarios: HTTP_SCENARIOS };
  }

  // ---------------------------------------------------------------- jest

  /**
   * Spawn jest for one spec (or all) and return structured results. `onLog`
   * receives raw stderr/stdout chunks for live streaming (SSE).
   */
  runJest(opts: {
    specPath?: string;
    testNamePattern?: string;
    onLog?: (chunk: string) => void;
  }): Promise<JestRunResult> {
    const args = ['jest', '--json', '--testLocationInResults', '--colors=false'];
    if (opts.specPath) {
      const abs = this.safeResolve(opts.specPath, { write: false });
      if (!/\.(spec|test)\.tsx?$/.test(abs)) {
        throw new BadRequestException('specPath must be a .spec.ts/.test.ts file');
      }
      // jest treats a bare positional as a regex against test paths.
      args.push(this.toRel(abs));
    } else {
      // Whole run — verbose gives per-suite progress lines for the live console.
      args.push('--verbose');
    }
    if (opts.testNamePattern) {
      args.push('-t', opts.testNamePattern);
    }

    return new Promise((resolve, reject) => {
      const child = spawn('npx', args, {
        cwd: this.root,
        shell: false,
        env: { ...process.env, CI: 'true', FORCE_COLOR: '0' },
      });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new BadRequestException(`Test run timed out after ${JEST_TIMEOUT_MS / 1000}s`));
      }, JEST_TIMEOUT_MS);

      child.stdout.on('data', (d) => {
        const s = d.toString();
        stdout += s;
      });
      child.stderr.on('data', (d) => {
        const s = d.toString();
        stderr += s;
        opts.onLog?.(s);
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        reject(new BadRequestException(`Failed to start jest: ${err.message}`));
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        const parsed = this.parseJestJson(stdout);
        const rawOutput = stderr.slice(-RAW_LOG_CAP);
        if (!parsed) {
          resolve({
            ok: false,
            numPassed: 0,
            numFailed: 0,
            numTotal: 0,
            durationMs: 0,
            suites: [],
            tests: [],
            rawOutput: (stderr + '\n' + stdout).slice(-RAW_LOG_CAP),
            exitCode: code,
          });
          return;
        }
        resolve({ ...this.shapeResult(parsed), rawOutput, exitCode: code });
      });
    });
  }

  private parseJestJson(stdout: string): any | null {
    const start = stdout.indexOf('{');
    const end = stdout.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) return null;
    try {
      return JSON.parse(stdout.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  private shapeResult(j: any): Omit<JestRunResult, 'rawOutput' | 'exitCode'> {
    const suites = (j.testResults || []).map((s: any) => ({
      file: this.toRel(s.name || s.testFilePath || ''),
      status: s.status ?? (s.numFailingTests ? 'failed' : 'passed'),
      tests: (s.assertionResults || []).map((a: any) => ({
        fullName: a.fullName || [...(a.ancestorTitles || []), a.title].join(' › '),
        title: a.title,
        ancestorTitles: a.ancestorTitles || [],
        status: a.status,
        durationMs: a.duration ?? 0,
        failureMessages: a.failureMessages || [],
      })),
    }));
    const tests: TestCaseResult[] = suites.flatMap((s: any) => s.tests);
    const durationMs = (j.testResults || []).reduce(
      (acc: number, s: any) => acc + Math.max(0, (s.endTime || 0) - (s.startTime || 0)),
      0,
    );
    return {
      ok: (j.numFailedTests || 0) === 0 && j.success !== false,
      numPassed: j.numPassedTests || 0,
      numFailed: j.numFailedTests || 0,
      numTotal: j.numTotalTests || 0,
      durationMs,
      suites,
      tests,
    };
  }

  // ---------------------------------------------------------------- http

  private getJsonPath(obj: any, pathExpr: string): unknown {
    if (!pathExpr) return obj;
    const parts = pathExpr
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(Boolean);
    let cur: any = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  async runHttp(scenario: HttpScenario): Promise<{
    ok: boolean;
    actualStatus: number;
    actualBody: unknown;
    checks: { name: string; ok: boolean; actual: unknown }[];
  }> {
    if (!scenario?.path || !scenario.path.startsWith('/')) {
      throw new BadRequestException('scenario.path must start with /');
    }
    const port = process.env.PORT || 3000;
    const url = `http://localhost:${port}${scenario.path}`;
    const method = (scenario.method || 'GET').toUpperCase();
    const headers: Record<string, string> = { ...(scenario.headers || {}) };
    let body: string | undefined;
    if (scenario.body !== undefined && method !== 'GET') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      body = typeof scenario.body === 'string' ? scenario.body : JSON.stringify(scenario.body);
    }

    let res: globalThis.Response;
    try {
      res = await fetch(url, { method, headers, body });
    } catch (e: any) {
      return {
        ok: false,
        actualStatus: 0,
        actualBody: `Request failed: ${e?.message || e}`,
        checks: [{ name: 'request reached server', ok: false, actual: e?.message }],
      };
    }

    let parsed: unknown;
    const text = await res.text();
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    const exp = scenario.expect || {};
    const checks: { name: string; ok: boolean; actual: unknown }[] = [];
    if (exp.status != null) {
      checks.push({ name: `status == ${exp.status}`, ok: res.status === exp.status, actual: res.status });
    }
    if (exp.jsonPath) {
      const val = this.getJsonPath(parsed, exp.jsonPath);
      if (exp.equals !== undefined) {
        checks.push({
          name: `${exp.jsonPath} == ${JSON.stringify(exp.equals)}`,
          ok: JSON.stringify(val) === JSON.stringify(exp.equals),
          actual: val,
        });
      } else {
        checks.push({ name: `${exp.jsonPath} exists`, ok: val !== undefined, actual: val });
      }
    }
    if (checks.length === 0) {
      checks.push({ name: 'response received', ok: res.status > 0, actual: res.status });
    }

    return { ok: checks.every((c) => c.ok), actualStatus: res.status, actualBody: parsed, checks };
  }
}
