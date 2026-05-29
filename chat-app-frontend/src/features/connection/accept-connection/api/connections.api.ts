import type { Connection } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";

export async function acceptConnectionRequestApi(
  connectionId: string,
): Promise<Connection> {
  try {
    const url = `/api/connections/request/${connectionId}/accept`;
    const { data } = await apiRequest({ url }).post({});

    return data;
  } catch (error) {
    console.error("Error accepting connection request:", error);
    throw error;
  }
}
