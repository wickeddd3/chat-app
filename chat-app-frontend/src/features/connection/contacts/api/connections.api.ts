import type { ConnectionUser } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";

export async function getContactsApi(): Promise<ConnectionUser[]> {
  try {
    const { data } = await apiRequest({
      url: `/api/connections/contacts`,
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw error;
  }
}
