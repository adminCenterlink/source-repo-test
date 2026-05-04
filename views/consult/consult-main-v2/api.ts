import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/common";
import type { ConsultKpi } from "./types";

export async function fetchConsultKpis(): Promise<ConsultKpi[]> {
  const res = await apiClient.get<ApiResponse<ConsultKpi[]>>("/consult/kpis");
  return res.data.data;
}
