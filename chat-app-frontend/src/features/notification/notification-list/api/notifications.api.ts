import type { PaginatedNotifications } from "@/entities/notification";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getNotificationsApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedNotifications> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/notifications${queryParams}`;

    const response = await apiRequest({ url }).get();
    const responseData: ApiResponse = response.data;

    return {
      notifications: responseData.data,
      hasMore: responseData.meta?.hasMore || false,
      nextCursor: responseData.meta?.nextCursor || null,
    };
  } catch (error: unknown) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}
