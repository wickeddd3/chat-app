import type { PaginatedNotifications } from "@/entities/notification";
import apiRequest from "@/shared/lib/axios.client";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getNotificationsApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedNotifications> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/notifications${queryParams}`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error: unknown) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}
