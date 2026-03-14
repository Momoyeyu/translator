import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';
import { BizCode } from '@/types/api';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/utils/token';

// Callback to notify auth store when session is invalidated.
// Set by authStore to avoid circular imports.
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(cb: () => void) {
  onSessionExpired = cb;
}

function invalidateSession() {
  clearTokens();
  onSessionExpired?.();
}

export class BizError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'BizError';
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Public auth paths that should never send tokens or trigger refresh
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/token/refresh',
  '/auth/logout',
  '/auth/password/',
  '/auth/invite/accept',
];

function isPublicAuthRequest(url: string): boolean {
  if (PUBLIC_AUTH_PATHS.some((p) => url.startsWith(p))) return true;
  // SSO authorize & callback are also public
  if (/^\/auth\/\w+\/authorize$/.test(url)) return true;
  if (/^\/auth\/\w+\/callback$/.test(url)) return true;
  return false;
}

// Request interceptor: attach Bearer token (skip public auth endpoints)
client.interceptors.request.use((config) => {
  const url = config.url || '';
  if (!isPublicAuthRequest(url)) {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Token refresh queue
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  refreshQueue = [];
}

// Public auth endpoints should not trigger token refresh
function isAuthRequest(config: InternalAxiosRequestConfig): boolean {
  const url = config.url || '';
  return isPublicAuthRequest(url);
}

// Handle 401 by attempting token refresh
async function handleUnauthorized(
  originalRequest: InternalAxiosRequestConfig & { _retried?: boolean },
  bizCode: number,
  bizMessage: string,
): Promise<unknown> {
  // Auth endpoints (login, register, etc.) handle their own 401 errors
  if (isAuthRequest(originalRequest)) {
    return Promise.reject(new BizError(bizCode, bizMessage));
  }

  if (originalRequest._retried) {
    invalidateSession();
    return Promise.reject(new BizError(bizCode, bizMessage));
  }

  if (!isRefreshing) {
    isRefreshing = true;
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      invalidateSession();
      return Promise.reject(new BizError(bizCode, bizMessage));
    }

    try {
      // Use raw axios to avoid interceptor loop
      const res = await axios.post<ApiResponse>(
        `${import.meta.env.VITE_API_BASE_URL}/auth/token/refresh`,
        { refresh_token: refreshToken },
      );
      const data = res.data.data as { access_token: string; refresh_token: string };
      setTokens(data.access_token, data.refresh_token);
      processQueue(null, data.access_token);

      originalRequest._retried = true;
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return client(originalRequest);
    } catch (err) {
      processQueue(err, null);
      invalidateSession();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }

  // Queue this request while refresh is in progress
  return new Promise((resolve, reject) => {
    refreshQueue.push({
      resolve: (token: string) => {
        originalRequest._retried = true;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        resolve(client(originalRequest));
      },
      reject,
    });
  });
}

// Response interceptor: unwrap envelope + handle 401
client.interceptors.response.use(
  async (response) => {
    // Blob responses (e.g. file downloads) bypass envelope unwrapping
    if (response.config.responseType === 'blob') {
      return response.data;
    }

    const body = response.data as ApiResponse;

    if (body.code === BizCode.OK) {
      return body.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    if (body.code === BizCode.Unauthorized) {
      const originalRequest = response.config as InternalAxiosRequestConfig & { _retried?: boolean };
      return handleUnauthorized(originalRequest, body.code, body.message);
    }

    return Promise.reject(new BizError(body.code, body.message));
  },
  async (error) => {
    // Handle HTTP 401 responses with token refresh
    if (error.response?.status === 401) {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
      const body = error.response.data as ApiResponse | undefined;
      const code = body?.code ?? BizCode.Unauthorized;
      const message = body?.message ?? 'Unauthorized';
      return handleUnauthorized(originalRequest, code, message);
    }

    if (error.response?.data) {
      const body = error.response.data as ApiResponse;
      if (body.code && body.message) {
        return Promise.reject(new BizError(body.code, body.message));
      }
    }
    return Promise.reject(error);
  },
);

export default client;
