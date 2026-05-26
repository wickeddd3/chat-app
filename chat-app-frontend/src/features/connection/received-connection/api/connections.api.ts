import type { Connection } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";

export async function receivedConnectionRequestsApi(): Promise<Connection[]> {
  try {
    const url = `/api/connections/received`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error) {
    console.error("Error fetching received connection requests:", error);
    throw error;
  }
}
