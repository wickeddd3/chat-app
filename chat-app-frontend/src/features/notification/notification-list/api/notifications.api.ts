import type {
  PaginatedNotifications,
  Notification,
} from "@/entities/notification";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams, type QueryParams } from "@/shared/utils/query-params";

export async function getNotificationsApi({
  params,
}: {
  params: QueryParams;
}): Promise<PaginatedNotifications> {
  const queryParams = toQueryParams(params);
  const url = `/api/notifications${queryParams}`;

  const response = await apiRequest.get<ApiResponse<Notification[]>>(url);

  const {
    data: {
      data,
      meta: { hasMore, nextCursor } = { hasMore: false, nextCursor: null },
    },
  } = response;

  return {
    notifications: data,
    hasMore,
    nextCursor,
  };
}
