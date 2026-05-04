import type { AuthTokens } from "@/types/api";

/**
 * 인증 토큰 저장/조회/갱신 유틸리티
 * - 브라우저 환경에서는 localStorage 사용
 * - SSR 환경에서는 안전하게 noop
 */

const ACCESS_KEY = "cp.auth.accessToken";
const REFRESH_KEY = "cp.auth.refreshToken";
const EXPIRES_KEY = "cp.auth.expiresAt";

const isBrowser = typeof window !== "undefined";

/** 저장된 토큰 조회 */
export function getTokens(): AuthTokens | null {
  if (!isBrowser) return null;
  const accessToken = window.localStorage.getItem(ACCESS_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_KEY);
  const expiresAtRaw = window.localStorage.getItem(EXPIRES_KEY);
  if (!accessToken || !refreshToken || !expiresAtRaw) return null;
  return {
    accessToken,
    refreshToken,
    expiresAt: Number(expiresAtRaw),
  };
}

/** 토큰 저장 */
export function saveTokens(tokens: AuthTokens): void {
  if (!isBrowser) return;
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  window.localStorage.setItem(EXPIRES_KEY, String(tokens.expiresAt));
}

/** 토큰 삭제 (로그아웃) */
export function clearTokens(): void {
  if (!isBrowser) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(EXPIRES_KEY);
}

/** 토큰 만료 여부 (60초 버퍼 포함) */
export function isTokenExpired(tokens: AuthTokens | null): boolean {
  if (!tokens) return true;
  return Date.now() >= tokens.expiresAt - 60_000;
}

/** access token만 빠르게 조회 */
export function getAccessToken(): string | null {
  return getTokens()?.accessToken ?? null;
}
