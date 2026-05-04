"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { type ReactNode, useState } from "react";
import { cn } from "@/utils/cn";
import type { PaginationMeta, SortState } from "@/types/common";

/**
 * 제네릭 데이터 테이블 (shadcn/ui + @tanstack/react-table)
 * - 기존 DataTableColumn API를 유지하면서 TanStack Table로 내부 구현 교체
 */

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, rowIndex: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: ReactNode;
  onRowClick?: (row: T) => void;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  /** 서버 정렬 상태 (지정하면 클라이언트 정렬 비활성화) */
  sortState?: SortState | null;
  onSortChange?: (state: SortState | null) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  loading = false,
  emptyMessage = "데이터가 없습니다",
  onRowClick,
  pagination,
  onPageChange,
  sortState,
  onSortChange,
  className,
}: DataTableProps<T>) {
  const isControlledSort = sortState !== undefined;
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);

  const sorting: SortingState = isControlledSort
    ? sortState
      ? [{ id: sortState.field, desc: sortState.direction === "desc" }]
      : []
    : internalSorting;

  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    if (isControlledSort && onSortChange) {
      onSortChange(
        next.length > 0 ? { field: next[0].id, direction: next[0].desc ? "desc" : "asc" } : null,
      );
    } else {
      setInternalSorting(next);
    }
  };

  // DataTableColumn → TanStack ColumnDef 변환
  const tanstackColumns: ColumnDef<T>[] = columns.map((col, colIdx) => ({
    id: col.key,
    accessorFn: (row: T) => (row as Record<string, unknown>)[col.key],
    enableSorting: col.sortable ?? false,
    header: col.header as string,
    cell: ({ row }) =>
      col.render
        ? col.render(row.original, row.index)
        : ((row.original as Record<string, unknown>)[col.key] as ReactNode),
    meta: { align: col.align, width: col.width, colIdx },
  }));

  const table = useReactTable({
    data,
    columns: tanstackColumns,
    state: { sorting },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: isControlledSort ? undefined : getSortedRowModel(),
    manualSorting: isControlledSort,
  });

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | { align?: string; width?: string }
                    | undefined;
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      style={meta?.width ? { width: meta.width } : undefined}
                      className={cn(
                        "border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700",
                        meta?.align === "center" && "text-center",
                        meta?.align === "right" && "text-right",
                      )}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-blue-600"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon sorted={sorted} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={rowKey(row.original, row.index)}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    "border-b border-gray-100 last:border-b-0 hover:bg-gray-50",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { align?: string }
                      | undefined;
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-3 py-2 text-gray-800",
                          meta?.align === "center" && "text-center",
                          meta?.align === "right" && "text-right",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && onPageChange && (
        <Pagination meta={pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (!sorted) return <span className="text-xs text-gray-300">↕</span>;
  return <span className="text-xs text-blue-600">{sorted === "asc" ? "↑" : "↓"}</span>;
}

function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, total } = meta;
  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
        총 <strong>{total.toLocaleString("ko-KR")}</strong>건 &nbsp;/&nbsp; {page} /{" "}
        {totalPages} 페이지
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50 hover:bg-gray-50"
        >
          이전
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50 hover:bg-gray-50"
        >
          다음
        </button>
      </div>
    </div>
  );
}
