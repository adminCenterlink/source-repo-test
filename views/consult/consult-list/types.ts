/** 상담 목록 화면 - 타입 정의 */

export type ConsultStatus = "PENDING" | "ONGOING" | "COMPLETED" | "CANCELLED";

export interface ConsultListItem {
  id: string;
  customerName: string;
  customerPhone: string;
  status: ConsultStatus;
  agentName: string;
  consultedAt: string;
  durationMinutes: number;
}

export interface ConsultListSearch {
  /** 고객명 또는 전화번호 키워드 */
  keyword?: string;
  /** 상태 필터 */
  status?: ConsultStatus | "ALL";
  /** 시작일 (YYYY-MM-DD) */
  fromDate?: string;
  /** 종료일 (YYYY-MM-DD) */
  toDate?: string;
}
