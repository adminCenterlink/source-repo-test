import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/common";
import type { QaCriterion, QaRecord } from "./types";

export async function fetchQaCriteria(): Promise<QaCriterion[]> {
  const res = await apiClient.get<ApiResponse<QaCriterion[]>>("/qa/criteria");
  return res.data.data;
}

export async function fetchRecentQaRecords(limit = 10): Promise<QaRecord[]> {
  const res = await apiClient.get<ApiResponse<QaRecord[]>>("/qa/records", {
    params: { limit },
  });
  return res.data.data;
}
