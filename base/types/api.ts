/**
 * API 요청/응답 관련 타입 정의
 */

/** API 에러 객체 */
export class ApiError extends Error {
  /** HTTP 상태 코드 */
  public readonly status: number;
  /** 백엔드에서 정의한 에러 코드 */
  public readonly code?: string;
  /** 추가 디테일 정보 */
  public readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** 요청 메서드 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** API 요청 설정 */
export interface RequestConfig {
  /** 요청 URL (baseURL과 합쳐짐) */
  url: string;
  /** HTTP 메서드 */
  method?: HttpMethod;
  /** 쿼리 파라미터 */
  params?: Record<string, unknown>;
  /** 요청 본문 */
  data?: unknown;
  /** 헤더 */
  headers?: Record<string, string>;
  /** 타임아웃 (ms) */
  timeout?: number;
  /** 인증 토큰 자동 주입 여부 (기본 true) */
  withAuth?: boolean;
  /** 재시도 횟수 (기본 0) */
  retries?: number;
}

/** 인증 토큰 페이로드 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** 만료 시각 (epoch ms) */
  expiresAt: number;
}
