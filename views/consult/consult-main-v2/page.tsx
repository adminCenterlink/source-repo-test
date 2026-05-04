"use client";

import { cn } from "@/utils/cn";
import { useConsultMainV2 } from "./hooks/use-consult-main-v2";

/**
 * 상담 메인 화면 v2 (variant)
 * - KPI 카드 강조 버전
 * - --as 옵션을 통해 consult-main 위치로 복사 가능
 */
export default function ConsultMainV2Page() {
  const { kpis, loading, error } = useConsultMainV2();

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">상담 대시보드 (V2)</h1>
        <p className="text-sm text-gray-500">KPI 카드 중심의 메인 화면입니다.</p>
        {error && (
          <p className="mt-2 text-xs text-amber-600">
            (백엔드 미연결 - 더미 데이터로 표시 중)
          </p>
        )}
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {(loading ? [] : kpis).map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {kpi.value.toLocaleString("ko-KR")}
              {kpi.unit && <span className="ml-1 text-base text-gray-500">{kpi.unit}</span>}
            </p>
            {typeof kpi.delta === "number" && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  kpi.delta > 0 ? "text-green-600" : kpi.delta < 0 ? "text-red-600" : "text-gray-500",
                )}
              >
                {kpi.delta > 0 ? "▲" : kpi.delta < 0 ? "▼" : "·"} {Math.abs(kpi.delta)}
              </p>
            )}
          </div>
        ))}
        {loading && <p className="text-sm text-gray-500">불러오는 중...</p>}
      </section>
    </div>
  );
}
