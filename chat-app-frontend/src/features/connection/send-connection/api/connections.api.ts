import type { Channel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";

export async function sendConnectionRequestApi(formData: {
  receiverId: string;
}): Promise<Channel> {
  try {
    const { data } = await apiRequest({
      url: "/api/connections/request",
    }).post(formData);
    return data;
  } catch (error) {
    console.error("Error sending connection request:", error);
    throw error;
  }
}
