/** 상담 메인 화면 - 타입 정의 */

export interface ConsultSummary {
  /** 오늘 상담 건수 */
  todayCount: number;
  /** 진행 중 상담 건수 */
  ongoingCount: number;
  /** 완료된 상담 건수 */
  completedCount: number;
  /** 평균 상담 시간(분) */
  averageDurationMinutes: number;
}

export interface ConsultRecentItem {
  id: string;
  customerName: string;
  customerPhone: string;
  status: "PENDING" | "ONGOING" | "COMPLETED";
  consultedAt: string;
}
