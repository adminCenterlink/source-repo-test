"use client";

import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format";
import { fetchQaCriteria, fetchRecentQaRecords } from "./api";
import type { QaCriterion, QaRecord } from "./types";

/**
 * QA(상담 품질 평가) 관리 화면
 * - 평가 기준 + 최근 평가 기록 표시
 */
export default function QaManagerPage() {
  const [criteria, setCriteria] = useState<QaCriterion[]>([]);
  const [records, setRecords] = useState<QaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [c, r] = await Promise.all([fetchQaCriteria(), fetchRecentQaRecords(10)]);
        if (cancelled) return;
        setCriteria(c);
        setRecords(r);
      } catch (e) {
        if (cancelled) return;
        setCriteria(dummyCriteria);
        setRecords(dummyRecords);
        setError(e instanceof Error ? e.message : "조회 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recordColumns: DataTableColumn<QaRecord>[] = [
    { key: "id", header: "평가번호", width: "100px" },
    { key: "consultId", header: "상담번호" },
    { key: "agentName", header: "상담원" },
    { key: "evaluatorName", header: "평가자" },
    {
      key: "totalScore",
      header: "총점",
      align: "right",
      sortable: true,
      render: (row) => `${row.totalScore.toFixed(1)} / 100`,
    },
    {
      key: "evaluatedAt",
      header: "평가일시",
      render: (row) => formatDate(row.evaluatedAt, true),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QA 관리</h1>
          <p className="text-sm text-gray-500">상담 품질 평가 기준과 최근 평가 결과를 관리합니다.</p>
          {error && (
            <p className="mt-2 text-xs text-amber-600">
              (백엔드 미연결 - 더미 데이터로 표시 중)
            </p>
          )}
        </div>
        <Button variant="default">새 평가 기준 추가</Button>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">평가 기준</h2>
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {criteria.map((c) => (
            <li key={c.id} className="rounded-md border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{c.name}</span>
                <span className="text-xs text-gray-500">가중치 {c.weight}%</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">{c.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">최근 평가 결과</h2>
        <DataTable
          data={records}
          columns={recordColumns}
          rowKey={(row) => row.id}
          loading={loading}
        />
      </section>
    </div>
  );
}

const dummyCriteria: QaCriterion[] = [
  { id: "Q1", name: "응대 친절도", weight: 25, description: "고객 응대 시 친절함과 매너" },
  { id: "Q2", name: "문제 해결력", weight: 35, description: "고객 문제를 정확히 파악·해결" },
  { id: "Q3", name: "상품 지식", weight: 20, description: "정확한 상품 안내 가능 여부" },
  { id: "Q4", name: "절차 준수", weight: 20, description: "스크립트 및 컴플라이언스 준수" },
];

const dummyRecords: QaRecord[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `Q-${String(2001 + i).padStart(4, "0")}`,
  consultId: `C-${String(1000 + i).padStart(4, "0")}`,
  agentName: `상담원${(i % 5) + 1}`,
  evaluatorName: `평가자${(i % 3) + 1}`,
  totalScore: 70 + Math.random() * 30,
  evaluatedAt: new Date(Date.now() - i * 86400000).toISOString(),
}));
