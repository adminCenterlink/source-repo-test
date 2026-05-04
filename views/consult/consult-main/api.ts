import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/common";
import type { ConsultRecentItem, ConsultSummary } from "./types";

/** 상담 메인 화면용 API */

export async function fetchConsultSummary(): Promise<ConsultSummary> {
  const res = await apiClient.get<ApiResponse<ConsultSummary>>("/consult/summary");
  return res.data.data;
}

export async function fetchRecentConsults(limit = 5): Promise<ConsultRecentItem[]> {
  const res = await apiClient.get<ApiResponse<ConsultRecentItem[]>>("/consult/recent", {
    params: { limit },
  });
  return res.data.data;
}
