export interface BaseResponse<T> {
  code: string;
  message: string;
  data: T;
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
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const body = await response.json();

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
