import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";

export async function getUnreadCountsApi(): Promise<Record<string, number>> {
  const url = `/api/stats/badge`;

  const response =
    await apiRequest.get<ApiResponse<Record<string, number>>>(url);

  const {
    data: { data },
  } = response;

  return data;
}
