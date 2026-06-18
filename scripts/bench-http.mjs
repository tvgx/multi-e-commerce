#!/usr/bin/env node
// Dependency-free HTTP throughput benchmark (autocannon-lite).
// Usage: node scripts/bench-http.mjs <url> [--connections N] [--duration S] [--method M] [--header 'K: V']... [--body '...']
import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';

const args = process.argv.slice(2);
const url = args[0];
if (!url || url.startsWith('--')) {
  console.error('Usage: node bench-http.mjs <url> [--connections N] [--duration S] [--method M] [--header "K: V"] [--body "..."]');
  process.exit(1);
}
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const connections = parseInt(opt('connections', '20'), 10);
const duration = parseFloat(opt('duration', '10'));
const method = opt('method', 'GET');
const body = opt('body', null);
const headers = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--header') {
    const h = args[i + 1];
    const idx = h.indexOf(':');
    headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
  }
}

const u = new URL(url);
const lib = u.protocol === 'https:' ? https : http;
const agent = new lib.Agent({ keepAlive: true, maxSockets: connections });

let completed = 0, errors = 0, non2xx = 0, bytes = 0;
const latencies = [];
let running = true;
const reqOptions = {
  protocol: u.protocol, hostname: u.hostname, port: u.port,
  path: u.pathname + u.search, method, headers, agent,
};

function fire() {
  if (!running) return;
  const start = performance.now();
  const req = lib.request(reqOptions, (res) => {
    if (res.statusCode < 200 || res.statusCode >= 300) non2xx++;
    res.on('data', (c) => (bytes += c.length));
    res.on('end', () => {
      latencies.push(performance.now() - start);
      completed++;
      fire();
    });
  });
  req.on('error', () => { errors++; if (running) setImmediate(fire); });
  if (body) req.write(body);
  req.end();
}

function pct(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

console.log(`\n→ ${method} ${url}  | connections=${connections} duration=${duration}s\n`);
const t0 = performance.now();
for (let i = 0; i < connections; i++) fire();

setTimeout(() => {
  running = false;
  const secs = (performance.now() - t0) / 1000;
  const s = latencies.sort((a, b) => a - b);
  const avg = s.reduce((a, b) => a + b, 0) / (s.length || 1);
  const fmt = (n) => n.toFixed(2);
  console.log(`Requests:     ${completed} (${errors} conn errors, ${non2xx} non-2xx)`);
  console.log(`Throughput:   ${fmt(completed / secs)} req/s`);
  console.log(`Data:         ${(bytes / 1024 / 1024).toFixed(2)} MB  (${(bytes / secs / 1024).toFixed(1)} KB/s)`);
  console.log(`Latency (ms): avg=${fmt(avg)}  p50=${fmt(pct(s, 50))}  p90=${fmt(pct(s, 90))}  p99=${fmt(pct(s, 99))}  max=${fmt(s[s.length - 1] || 0)}`);
  agent.destroy();
  process.exit(0);
}, duration * 1000);
