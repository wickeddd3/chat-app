import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function cancelConnectionRequestApi(id: string): Promise<Channel> {
  try {
    const url = `/api/connections/request/${id}/cancel`;
    const { data } = await apiRequest({ url }).post({});

    return data;
  } catch (error) {
    console.error("Error canceling connection request:", error);
    throw error;
  }
}
