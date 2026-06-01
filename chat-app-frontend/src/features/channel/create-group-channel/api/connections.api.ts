import type { PaginatedContacts } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getContactsApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedContacts> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/connections/contacts${queryParams}`;

    const response = await apiRequest({ url }).get();
    const responseData: ApiResponse = response.data;

    return {
      contacts: responseData.data,
      hasMore: responseData.meta?.hasMore || false,
      nextCursor: responseData.meta?.nextCursor || null,
    };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw error;
  }
}
