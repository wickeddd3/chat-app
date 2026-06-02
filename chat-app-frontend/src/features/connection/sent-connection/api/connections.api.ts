import type { Connection, PaginatedConnections } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams, type QueryParams } from "@/shared/utils/query-params";

export async function sentConnectionRequestsApi({
  params,
}: {
  params: QueryParams;
}): Promise<PaginatedConnections> {
  const queryParams = toQueryParams(params);
  const url = `/api/connections/sent${queryParams}`;

  const response = await apiRequest.get<ApiResponse<Connection[]>>(url);

  const {
    data: {
      data,
      meta: { hasMore, nextCursor } = { hasMore: false, nextCursor: null },
    },
  } = response;

  return {
    connections: data,
    hasMore,
    nextCursor,
  };
}
