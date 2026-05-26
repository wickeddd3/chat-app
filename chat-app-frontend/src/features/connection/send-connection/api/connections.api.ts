import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function sendConnectionRequestApi(formData: {
  receiverId: string;
}): Promise<Channel> {
  try {
    const url = "/api/connections/request";
    const { data } = await apiRequest({ url }).post(formData);

    return data;
  } catch (error) {
    console.error("Error sending connection request:", error);
    throw error;
  }
}
