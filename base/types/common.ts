/**
 * 공통 타입 정의
 * - 모든 도메인에서 공용으로 사용되는 기본 타입
 */

/** 공통 API 응답 래퍼 */
export interface ApiResponse<T> {
  /** 응답 성공 여부 */
  success: boolean;
  /** 응답 데이터 */
  data: T;
  /** 응답 메시지 */
  message?: string;
  /** 응답 코드 (예: "OK", "VALIDATION_ERROR") */
  code?: string;
  /** 응답 타임스탬프 (ISO 8601) */
  timestamp?: string;
}

/** 페이지네이션 메타정보 */
export interface PaginationMeta {
  /** 현재 페이지 (1-based) */
  page: number;
  /** 페이지당 항목 수 */
  pageSize: number;
  /** 전체 항목 수 */
  total: number;
  /** 전체 페이지 수 */
  totalPages: number;
}

/** 페이지네이션이 적용된 응답 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/** 셀렉트 옵션 */
export interface SelectOption<TValue = string> {
  label: string;
  value: TValue;
  disabled?: boolean;
}

/** 정렬 방향 */
export type SortDirection = "asc" | "desc";

/** 정렬 정보 */
export interface SortState {
  field: string;
  direction: SortDirection;
}

/** ID 형식 (문자열/숫자 모두 허용) */
export type ID = string | number;

/** 비어있을 수 있는 값 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
