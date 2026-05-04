"use client";

import { Customer } from "@/components/domain/customer";
import { formatDate } from "@/utils/format";
import { useConsultMain } from "./hooks/use-consult-main";

/**
 * 상담 메인 화면
 * - 요약 통계 + 최근 상담 목록
 */
export default function ConsultMainPage() {
  const { summary, recent, loading, error } = useConsultMain();

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">상담 메인</h1>
        <p className="text-sm text-gray-500">상담 현황과 최근 이력을 확인합니다.</p>
        {error && (
          <p className="mt-2 text-xs text-amber-600">
            (백엔드 미연결 - 더미 데이터로 표시 중: {error})
          </p>
        )}
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="오늘 상담" value={summary?.todayCount} loading={loading} />
        <SummaryCard label="진행 중" value={summary?.ongoingCount} loading={loading} />
        <SummaryCard label="완료" value={summary?.completedCount} loading={loading} />
        <SummaryCard
          label="평균 상담시간(분)"
          value={summary?.averageDurationMinutes}
          loading={loading}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">최근 상담</h2>
        {loading ? (
          <p className="text-sm text-gray-500">불러오는 중...</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-gray-500">최근 상담이 없습니다.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {recent.map((item) => (
              <li key={item.id}>
                <Customer
                  name={item.customerName}
                  phone={item.customerPhone}
                  lastConsultedAt={item.consultedAt}
                  grade="GENERAL"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="text-xs text-gray-400">
        조회 기준 시각: {formatDate(new Date(), true)}
      </footer>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">
        {loading ? "..." : (value ?? 0).toLocaleString("ko-KR")}
      </p>
    </div>
  );
}
