/**
 * _logged-fetch.ts
 *
 * Drop-in replacement for `fetch` used by the storefront BFF layer
 * (storefront.api.ts). These fetches run server-side (RSC), so the log lines
 * land in the **storefront terminal** — showing the response the storefront
 * received from api-core.
 *
 * Dev-only: in production it's a thin passthrough with no clone/serialize cost.
 */

const DEV = process.env.NODE_ENV !== 'production';

function preview(text: string, max = 500): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}… (+${text.length - max} chars)` : text;
}

function logBlock(method: string, path: string, status: number | string, ms: number, data: string) {
  const lines = [
    `┌─ ← [${method}] ${path} · ${status} · ${ms}ms`,
    `│ data : ${preview(data)}`,
    `└${'─'.repeat(46)}`,
  ];
  // console.log on the server prints to the storefront `next dev` terminal.
  console.log(lines.join('\n'));
}

export async function loggedFetch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
): Promise<Response> {
  if (!DEV) return fetch(input, init);

  const method = (init?.method || 'GET').toUpperCase();
  const url = typeof input === 'string' ? input : input.toString();
  const path = url.replace(/^https?:\/\/[^/]+/, ''); // strip origin, keep /api/...
  const start = Date.now();

  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (err) {
    logBlock(method, path, 'ERR', Date.now() - start, String((err as Error)?.message ?? err));
    throw err;
  }

  // Read a clone so the caller's res.json()/res.text() still works.
  let body = '';
  try {
    body = await res.clone().text();
  } catch {
    /* body not readable (e.g. already consumed elsewhere) — skip */
  }
  logBlock(method, path, res.status, Date.now() - start, body);

  return res;
}
