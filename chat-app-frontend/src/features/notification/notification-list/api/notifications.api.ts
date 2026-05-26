import type { PaginatedNotifications } from "@/entities/notification";
import apiRequest from "@/shared/lib/axios.client";
import { toQueryParams } from "@/shared/utils/query-params";

interface GetNotificationsApiResponse {
  data: PaginatedNotifications;
}

export async function getNotificationsApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedNotifications> {
  try {
    const queryParams = toQueryParams({ params });
    const { data }: GetNotificationsApiResponse = await apiRequest({
      url: `/api/notifications/${queryParams}`,
    }).get();
    return data;
  } catch (error: unknown) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}
