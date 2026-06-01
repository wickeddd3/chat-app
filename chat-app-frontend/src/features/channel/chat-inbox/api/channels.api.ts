import type { PaginatedInboxChannel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getInboxApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedInboxChannel> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/channels${queryParams}`;

    const response = await apiRequest({ url }).get();
    const responseData: ApiResponse = response.data;

    return {
      channels: responseData.data,
      hasMore: responseData.meta?.hasMore || false,
      nextCursor: responseData.meta?.nextCursor || null,
    };
  } catch (error) {
    console.error("Error fetching inbox:", error);
    throw error;
  }
}
