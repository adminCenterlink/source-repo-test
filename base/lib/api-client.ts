import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "@/types/api";
import { clearTokens, getTokens, isTokenExpired, saveTokens } from "@/lib/auth";

/**
 * 공통 Axios 인스턴스
 * - 인증 토큰 자동 주입
 * - 401 응답 시 토큰 자동 갱신 후 재시도 (1회)
 * - 통일된 ApiError로 변환
 */

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/** 요청 인터셉터 - 토큰 주입 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getTokens();
  if (tokens && !isTokenExpired(tokens)) {
    config.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }
  return config;
});

/** 토큰 갱신 중복 호출 방지용 promise */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const tokens = getTokens();
    if (!tokens) throw new ApiError("리프레시 토큰이 없습니다", 401);
    try {
      const res = await axios.post(`${baseURL}/auth/refresh`, {
        refreshToken: tokens.refreshToken,
      });
      const next = res.data?.data ?? res.data;
      saveTokens({
        accessToken: next.accessToken,
        refreshToken: next.refreshToken ?? tokens.refreshToken,
        expiresAt: next.expiresAt ?? Date.now() + 60 * 60 * 1000,
      });
      return next.accessToken as string;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/** 응답 인터셉터 - 에러 변환 + 401 토큰 갱신 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as
      | (InternalAxiosRequestConfig & { __retried?: boolean })
      | undefined;

    if (error.response?.status === 401 && originalConfig && !originalConfig.__retried) {
      originalConfig.__retried = true;
      try {
        const accessToken = await refreshAccessToken();
        originalConfig.headers.set("Authorization", `Bearer ${accessToken}`);
        return apiClient.request(originalConfig);
      } catch (refreshError) {
        clearTokens();
        throw new ApiError("세션이 만료되었습니다. 다시 로그인해주세요.", 401, "SESSION_EXPIRED");
      }
    }

    if (error.response) {
      const data = error.response.data as { message?: string; code?: string } | undefined;
      throw new ApiError(
        data?.message ?? error.message,
        error.response.status,
        data?.code,
        error.response.data,
      );
    }

    if (error.request) {
      throw new ApiError("네트워크 오류가 발생했습니다", 0, "NETWORK_ERROR");
    }

    throw new ApiError(error.message ?? "알 수 없는 오류", 0, "UNKNOWN");
  },
);

export default apiClient;
