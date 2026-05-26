import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function acceptConnectionRequestApi(id: string): Promise<Channel> {
  try {
    const url = `/api/connections/request/${id}/accept`;
    const { data } = await apiRequest({ url }).post({});

    return data;
  } catch (error) {
    console.error("Error accepting connection request:", error);
    throw error;
  }
}
