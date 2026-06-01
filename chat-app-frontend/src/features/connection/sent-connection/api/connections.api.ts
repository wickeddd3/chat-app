import type { PaginatedConnections } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams } from "@/shared/utils/query-params";

export async function sentConnectionRequestsApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedConnections> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/connections/sent${queryParams}`;

    const response = await apiRequest({ url }).get();
    const responseData: ApiResponse = response.data;

    return {
      connections: responseData.data,
      hasMore: responseData.meta?.hasMore || false,
      nextCursor: responseData.meta?.nextCursor || "",
    };
  } catch (error) {
    console.error("Error fetching sent connection requests:", error);
    throw error;
  }
}
