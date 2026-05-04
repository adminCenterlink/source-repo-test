import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/types/common";
import type { ConsultListItem, ConsultListSearch } from "./types";

/** 상담 목록 조회 API */
export async function fetchConsultList(
  params: ConsultListSearch & { page: number; pageSize: number },
): Promise<PaginatedResponse<ConsultListItem>> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<ConsultListItem>>>(
    "/consult/list",
    { params },
  );
  return res.data.data;
}

/** 상담 단건 조회 */
export async function fetchConsultDetail(id: string): Promise<ConsultListItem> {
  const res = await apiClient.get<ApiResponse<ConsultListItem>>(`/consult/${id}`);
  return res.data.data;
}
