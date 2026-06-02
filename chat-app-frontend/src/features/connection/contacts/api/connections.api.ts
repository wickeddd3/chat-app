import type { ConnectionUser, PaginatedContacts } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams, type QueryParams } from "@/shared/utils/query-params";

export async function getContactsApi({
  params,
}: {
  params: QueryParams;
}): Promise<PaginatedContacts> {
  const queryParams = toQueryParams(params);
  const url = `/api/connections/contacts${queryParams}`;

  const response = await apiRequest.get<ApiResponse<ConnectionUser[]>>(url);

  const {
    data: {
      data,
      meta: { hasMore, nextCursor } = { hasMore: false, nextCursor: null },
    },
  } = response;

  return {
    contacts: data,
    hasMore,
    nextCursor,
  };
}
