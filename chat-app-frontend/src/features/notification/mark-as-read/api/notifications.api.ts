import apiRequest from "@/shared/lib/axios.client";

export async function markNotificationAsReadApi(
  notificationIds: string[],
): Promise<{ count: number }> {
  try {
    const url = `/api/notifications/mark-as-read`;
    const { data } = await apiRequest({ url }).post({ notificationIds });

    return data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}
