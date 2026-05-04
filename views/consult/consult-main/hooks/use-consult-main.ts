"use client";

import { useEffect, useState } from "react";
import { fetchConsultSummary, fetchRecentConsults } from "../api";
import type { ConsultRecentItem, ConsultSummary } from "../types";

/** 상담 메인 데이터 페칭 훅 */
export function useConsultMain() {
  const [summary, setSummary] = useState<ConsultSummary | null>(null);
  const [recent, setRecent] = useState<ConsultRecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, r] = await Promise.all([fetchConsultSummary(), fetchRecentConsults(10)]);
        if (cancelled) return;
        setSummary(s);
        setRecent(r);
      } catch (e) {
        if (cancelled) return;
        // PoC: 실패 시 더미 데이터로 fallback (백엔드 미연동 환경 고려)
        setSummary({
          todayCount: 12,
          ongoingCount: 3,
          completedCount: 87,
          averageDurationMinutes: 14,
        });
        setRecent([
          {
            id: "C-1001",
            customerName: "홍길동",
            customerPhone: "01012345678",
            status: "COMPLETED",
            consultedAt: new Date().toISOString(),
          },
          {
            id: "C-1002",
            customerName: "김영희",
            customerPhone: "01098765432",
            status: "ONGOING",
            consultedAt: new Date().toISOString(),
          },
        ]);
        setError(e instanceof Error ? e.message : "데이터 조회 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { summary, recent, loading, error };
}
