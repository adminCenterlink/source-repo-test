"use client";

import { Button } from "@/components/ui/button";
import { formatDate, formatPhone } from "@/utils/format";
import type { ConsultListItem } from "../types";

const statusLabel: Record<ConsultListItem["status"], string> = {
  PENDING: "대기",
  ONGOING: "진행중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

/**
 * 상담 목록의 우측/모달 상세 패널
 */
export function ConsultListDetail({
  item,
  onClose,
}: {
  item: ConsultListItem | null;
  onClose: () => void;
}) {
  if (!item) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
        좌측 목록에서 상담 건을 선택하세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">상담 상세 - {item.id}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          닫기
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Field label="고객명" value={item.customerName} />
        <Field label="전화번호" value={formatPhone(item.customerPhone)} />
        <Field label="상태" value={statusLabel[item.status]} />
        <Field label="담당자" value={item.agentName} />
        <Field label="상담 일시" value={formatDate(item.consultedAt, true)} />
        <Field label="상담 시간" value={`${item.durationMinutes}분`} />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}
