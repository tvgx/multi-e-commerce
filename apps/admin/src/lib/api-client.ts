export interface BaseResponse<T> {
  code: string;
  message: string;
  data: T;
}

const DEV = process.env.NODE_ENV !== "production";

/**
 * Forward a compact response log to the admin terminal via the dev-only
 * /api/_devlog route. Browser + dev only; fire-and-forget (never blocks/throws).
 */
function forwardDevLog(payload: {
  method: string;
  path: string;
  status: number;
  ms: number;
  data: unknown;
}) {
  if (!DEV || typeof window === "undefined") return;
  try {
    fetch("/api/_devlog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { shopId?: string } = {}
  ): Promise<BaseResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Default headers
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (options.shopId) {
      headers.set("x-shop-id", options.shopId);
    }

    // Add credentials if needed (Cookie auth is handled by browser)
    const startTime = Date.now();
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const body = await response.json();

    // Forward to the admin terminal (dev only) — covers both ok and error responses.
    forwardDevLog({
      method: (options.method || "GET").toString(),
      path: endpoint,
      status: response.status,
      ms: Date.now() - startTime,
      data: body,
    });

    if (!response.ok) {
      throw new Error(body.message || "An error occurred");
    }

    return body as BaseResponse<T>;
  }

  async get<T>(endpoint: string, options: RequestInit & { shopId?: string } = {}) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body: unknown, options: RequestInit & { shopId?: string } = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown, options: RequestInit & { shopId?: string } = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options: RequestInit & { shopId?: string } = {}) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  async patch<T>(endpoint: string, body: unknown, options: RequestInit & { shopId?: string } = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();
