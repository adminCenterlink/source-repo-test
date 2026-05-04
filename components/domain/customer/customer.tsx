"use client";

import { cn } from "@/utils/cn";
import { formatDate, formatPhone } from "@/utils/format";

/**
 * 고객 정보 카드 - 도메인 컴포넌트
 * - 고객명, 전화번호, 등급, 최근 상담일을 표시
 */

export type CustomerGrade = "VIP" | "GOLD" | "SILVER" | "BRONZE" | "GENERAL";

export interface CustomerProps {
  /** 고객명 */
  name: string;
  /** 전화번호 (raw) */
  phone: string;
  /** 등급 */
  grade?: CustomerGrade;
  /** 최근 상담일 (ISO 문자열) */
  lastConsultedAt?: string | null;
  /** 클릭 핸들러 */
  onClick?: () => void;
  className?: string;
}

const gradeStyle: Record<CustomerGrade, string> = {
  VIP: "bg-purple-100 text-purple-700",
  GOLD: "bg-yellow-100 text-yellow-800",
  SILVER: "bg-gray-200 text-gray-700",
  BRONZE: "bg-orange-100 text-orange-700",
  GENERAL: "bg-blue-50 text-blue-700",
};

export function Customer({
  name,
  phone,
  grade = "GENERAL",
  lastConsultedAt,
  onClick,
  className,
}: CustomerProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 rounded-md border border-gray-200 bg-white p-3 transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
        className,
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-gray-900">{name}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            gradeStyle[grade],
          )}
        >
          {grade}
        </span>
      </div>
      <span className="text-sm text-gray-600">{formatPhone(phone)}</span>
      <span className="text-xs text-gray-400">
        최근 상담일: {lastConsultedAt ? formatDate(lastConsultedAt) : "이력 없음"}
      </span>
    </div>
  );
}
