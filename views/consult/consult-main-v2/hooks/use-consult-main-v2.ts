"use client";

import { useEffect, useState } from "react";
import { fetchConsultKpis } from "../api";
import type { ConsultKpi } from "../types";

export function useConsultMainV2() {
  const [kpis, setKpis] = useState<ConsultKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchConsultKpis();
        if (!cancelled) setKpis(data);
      } catch (e) {
        if (cancelled) return;
        setKpis([
          { label: "오늘 상담", value: 12, delta: 2, unit: "건" },
          { label: "진행 중", value: 3, delta: -1, unit: "건" },
          { label: "완료", value: 87, delta: 5, unit: "건" },
          { label: "평균 만족도", value: 4.6, delta: 0.1, unit: "점" },
        ]);
        setError(e instanceof Error ? e.message : "조회 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { kpis, loading, error };
}
