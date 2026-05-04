"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { SearchBox } from "@/components/domain/search-box";
import { formatDate, formatPhone } from "@/utils/format";
import { ConsultListDetail } from "./components/consult-list-detail";
import { useConsultList } from "./hooks/use-consult-list";
import type { ConsultListItem } from "./types";
import { consultListSearchSchema } from "./schema";

const statusLabel: Record<ConsultListItem["status"], string> = {
  PENDING: "대기",
  ONGOING: "진행중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const statusVariant: Record<ConsultListItem["status"], BadgeVariant> = {
  PENDING: "warning",
  ONGOING: "default",
  COMPLETED: "success",
  CANCELLED: "secondary",
};

/**
 * 상담 목록 화면
 * - 검색 박스 + 데이터 테이블 + 페이지네이션 + 상세 패널
 */
export default function ConsultListPage() {
  const {
    search,
    setSearch,
    submitSearch,
    resetSearch,
    page,
    setPage,
    items,
    meta,
    loading,
    error,
  } = useConsultList();

  const [selected, setSelected] = useState<ConsultListItem | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    const result = consultListSearchSchema.safeParse(search);
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? "검색 조건이 올바르지 않습니다");
      return;
    }
    setValidationError(null);
    submitSearch(search);
  };

  const handleReset = () => {
    setValidationError(null);
    resetSearch();
  };

  const columns: DataTableColumn<ConsultListItem>[] = [
    { key: "id", header: "상담번호", width: "120px" },
    { key: "customerName", header: "고객명", sortable: true },
    {
      key: "customerPhone",
      header: "전화번호",
      render: (row) => formatPhone(row.customerPhone),
    },
    {
      key: "status",
      header: "상태",
      align: "center",
      render: (row) => (
        <Badge variant={statusVariant[row.status]}>
          {statusLabel[row.status]}
        </Badge>
      ),
    },
    { key: "agentName", header: "담당자" },
    {
      key: "consultedAt",
      header: "상담일시",
      sortable: true,
      render: (row) => formatDate(row.consultedAt, true),
    },
    {
      key: "durationMinutes",
      header: "상담시간(분)",
      align: "right",
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">상담 목록</h1>
        <p className="text-sm text-gray-500">조건을 입력하여 상담 이력을 조회합니다.</p>
        {error && (
          <p className="mt-2 text-xs text-amber-600">
            (백엔드 미연결 - 더미 데이터로 표시 중)
          </p>
        )}
      </header>

      <SearchBox
        columns={3}
        loading={loading}
        onSubmit={handleSubmit}
        onReset={handleReset}
      >
        <Input
          label="검색어"
          placeholder="고객명 또는 전화번호"
          value={search.keyword ?? ""}
          onChange={(e) => setSearch({ ...search, keyword: e.target.value })}
        />
        <Input
          label="시작일"
          type="date"
          value={search.fromDate ?? ""}
          onChange={(e) => setSearch({ ...search, fromDate: e.target.value })}
          error={validationError ?? undefined}
        />
        <Input
          label="종료일"
          type="date"
          value={search.toDate ?? ""}
          onChange={(e) => setSearch({ ...search, toDate: e.target.value })}
        />
      </SearchBox>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <DataTable
          data={items}
          columns={columns}
          rowKey={(row) => row.id}
          loading={loading}
          pagination={meta}
          onPageChange={setPage}
          onRowClick={setSelected}
        />
        <ConsultListDetail item={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}
