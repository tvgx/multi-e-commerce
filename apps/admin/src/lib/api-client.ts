export interface BaseResponse<T> {
  statusCode: string;
  message: string;
  data: T;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BaseResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Default headers
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Add credentials if needed (Cookie auth is handled by browser)
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || "An error occurred");
    }

    return body as BaseResponse<T>;
  }

  async get<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body: any, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
