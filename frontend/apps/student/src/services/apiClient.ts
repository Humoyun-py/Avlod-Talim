/**
 * Centralized API Client & Service Bridge
 * 
 * Provides:
 * - JWT token management (Access & Refresh tokens)
 * - Standardized Request / Response interceptor
 */

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

const ACCESS_TOKEN_KEY = 'avlod_access_token';
const REFRESH_TOKEN_KEY = 'avlod_refresh_token';

export class ApiClient {
  private static baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

  public static getMode(): 'mock' | 'live' {
    return 'live';
  }

  public static setMode(mode: 'mock' | 'live'): void {
    if (mode !== 'live') throw new Error('Mock mode is disabled for application data.');
  }

  public static getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public static setTokens(access: string, refresh?: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
      if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    } catch {
      // ignore
    }
  }

  public static clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  }

  public static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    try {
      let response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401 && this.getAccessToken()) {
        const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refresh && !endpoint.includes('/auth/token/refresh/')) {
          const refreshed = await fetch(`${this.baseUrl}/auth/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) });
          if (refreshed.ok) {
            const tokens = await refreshed.json();
            this.setTokens(tokens.access, tokens.refresh || refresh);
            response = await fetch(url, { ...options, headers: { ...headers, Authorization: `Bearer ${tokens.access}` } });
          } else this.clearTokens();
        }
      }
      if (!response.ok) {
        let errorMsg = `HTTP Error ${response.status}`;
        try {
          const errorJson = await response.json();
          errorMsg = errorJson.detail || errorJson.message || errorMsg;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (err: unknown) {
      throw err;
    }
  }
}
