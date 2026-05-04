"use client";

import { type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

/**
 * 검색 조건 박스 - 도메인 컴포넌트
 * - 자식으로 검색 필드(Input/Select 등)를 받아 grid 레이아웃으로 정렬
 * - 검색/초기화 버튼 영역 제공
 */

export interface SearchBoxProps {
  /** 검색 필드 */
  children: ReactNode;
  /** 검색 버튼 클릭 시 호출 */
  onSubmit: () => void;
  /** 초기화 버튼 클릭 시 호출 */
  onReset?: () => void;
  /** 로딩 상태 (검색 중) */
  loading?: boolean;
  /** 1행에 표시할 컬럼 수 */
  columns?: 1 | 2 | 3 | 4;
  /** 검색 버튼 라벨 */
  submitLabel?: string;
  className?: string;
}

const columnClass: Record<NonNullable<SearchBoxProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

export function SearchBox({
  children,
  onSubmit,
  onReset,
  loading = false,
  columns = 3,
  submitLabel = "검색",
  className,
}: SearchBoxProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4",
        className,
      )}
    >
      <div className={cn("grid gap-3", columnClass[columns])}>{children}</div>
      <div className="flex justify-end gap-2">
        {onReset && (
          <Button type="button" variant="outline" onClick={onReset} disabled={loading}>
            초기화
          </Button>
        )}
        <Button type="submit" variant="default" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
