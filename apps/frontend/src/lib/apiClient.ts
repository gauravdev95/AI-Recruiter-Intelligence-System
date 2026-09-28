import axios, { type InternalAxiosRequestConfig } from "axios";

import { readCookie } from "./cookies";
import { getAccessToken, setAccessToken } from "./tokenStore";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  // Required so the httpOnly refresh cookie (and CSRF cookie) are sent to
  // the backend, which runs on a different port in development.
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  const csrfToken = readCookie(CSRF_COOKIE_NAME);
  if (csrfToken) {
    config.headers.set(CSRF_HEADER_NAME, csrfToken);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

/** Attempts a silent session refresh via the httpOnly cookie. Coalesces
 * concurrent callers into a single in-flight request. */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access_token: string }>(
        `${API_BASE}/api/v1/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: { [CSRF_HEADER_NAME]: readCookie(CSRF_COOKIE_NAME) ?? "" },
        },
      )
      .then((res) => {
        setAccessToken(res.data.access_token);
        return res.data.access_token;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registered once by the auth layer on mount. Called when a 401-triggered
 * refresh attempt fails (session truly expired/revoked) so the subscriber
 * can clear local session state. Not a hard redirect here, to keep this
 * module decoupled from react-router. */
export function onUnauthorized(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableConfig;
    const isRefreshEndpoint = originalRequest.url?.endsWith("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retried && !isRefreshEndpoint) {
      originalRequest._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        return apiClient(originalRequest);
      }
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  },
);
