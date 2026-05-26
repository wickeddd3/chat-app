import type { PaginatedConnections } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";
import { toQueryParams } from "@/shared/utils/query-params";

export async function sentConnectionRequestsApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedConnections> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/connections/sent${queryParams}`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error) {
    console.error("Error fetching sent connection requests:", error);
    throw error;
  }
}
