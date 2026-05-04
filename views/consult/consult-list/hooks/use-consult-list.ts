"use client";

import { useCallback, useEffect, useState } from "react";
import type { PaginatedResponse, PaginationMeta } from "@/types/common";
import { fetchConsultList } from "../api";
import type { ConsultListItem, ConsultListSearch } from "../types";

const DEFAULT_PAGE_SIZE = 20;

/**
 * 상담 목록 검색/페이지네이션 훅
 */
export function useConsultList() {
  const [search, setSearch] = useState<ConsultListSearch>({ status: "ALL" });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ConsultListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (currentSearch: ConsultListSearch, currentPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const res: PaginatedResponse<ConsultListItem> = await fetchConsultList({
          ...currentSearch,
          page: currentPage,
          pageSize: DEFAULT_PAGE_SIZE,
        });
        setItems(res.items);
        setMeta(res.meta);
      } catch (e) {
        // 더미 데이터로 fallback
        const dummy = makeDummy(currentPage, DEFAULT_PAGE_SIZE);
        setItems(dummy.items);
        setMeta(dummy.meta);
        setError(e instanceof Error ? e.message : "조회 실패");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(search, page);
  }, [load, page, search]);

  const submitSearch = (next: ConsultListSearch) => {
    setSearch(next);
    setPage(1);
  };

  const resetSearch = () => {
    setSearch({ status: "ALL" });
    setPage(1);
  };

  return {
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
  };
}

function makeDummy(
  page: number,
  pageSize: number,
): PaginatedResponse<ConsultListItem> {
  const total = 73;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const items: ConsultListItem[] = Array.from({ length: Math.min(pageSize, total - start) }).map(
    (_, i) => ({
      id: `C-${(start + i + 1).toString().padStart(4, "0")}`,
      customerName: `고객${start + i + 1}`,
      customerPhone: `010${String(10000000 + start + i).slice(0, 8)}`,
      status: ["PENDING", "ONGOING", "COMPLETED", "CANCELLED"][i % 4] as ConsultListItem["status"],
      agentName: `상담원${(i % 5) + 1}`,
      consultedAt: new Date(Date.now() - i * 86400000).toISOString(),
      durationMinutes: 5 + (i % 30),
    }),
  );
  return { items, meta: { page, pageSize, total, totalPages } };
}
