import type { NextRequest } from "next/server";

/**
 * Dev-only log forwarder.
 *
 * The admin `apiClient` runs in the browser and calls api-core (:3000) directly,
 * so its response logs would only show in the browser console. This route lets
 * the client POST a compact log payload which we print to the **admin terminal**
 * (the `next dev` process). No-op in production.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 204 });
  }

  try {
    const { method, path, status, ms, data } = await req.json();
    let preview: string;
    try {
      preview = typeof data === "string" ? data : JSON.stringify(data);
    } catch {
      preview = String(data);
    }
    if (preview && preview.length > 500) {
      preview = `${preview.slice(0, 500)}… (+${preview.length - 500} chars)`;
    }

    const lines = [
      `┌─ ← [${method}] ${path} · ${status} · ${ms}ms`,
      `│ data : ${preview ?? ""}`,
      `└${"─".repeat(46)}`,
    ];
    // Prints to the admin `next dev` terminal.
    console.log(lines.join("\n"));
  } catch {
    /* ignore malformed payloads */
  }

  return new Response(null, { status: 204 });
}
