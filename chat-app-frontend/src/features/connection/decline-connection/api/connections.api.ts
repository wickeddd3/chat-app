import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function declineConnectionRequestApi(
  id: string,
): Promise<Channel> {
  try {
    const url = `/api/connections/request/${id}/decline`;
    const { data } = await apiRequest({ url }).post({});

    return data;
  } catch (error) {
    console.error("Error declining connection request:", error);
    throw error;
  }
}
