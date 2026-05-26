import type { Connection } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";

export async function sentConnectionRequestsApi(): Promise<Connection[]> {
  try {
    const url = `/api/connections/sent`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error) {
    console.error("Error fetching sent connection requests:", error);
    throw error;
  }
}
