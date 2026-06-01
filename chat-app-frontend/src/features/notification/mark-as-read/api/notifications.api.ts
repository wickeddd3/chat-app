import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";

export async function markNotificationAsReadApi(
  notificationIds: string[],
): Promise<{ count: number }> {
  const url = `/api/notifications/mark-as-read`;

  const response = await apiRequest.post<ApiResponse<{ count: number }>>(url, {
    notificationIds,
  });

  const {
    data: { data },
  } = response;

  return data;
}
