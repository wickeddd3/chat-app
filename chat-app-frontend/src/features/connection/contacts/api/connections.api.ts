import type { ConnectionUser } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";

export async function getContactsApi(): Promise<ConnectionUser[]> {
  try {
    const url = `/api/connections/contacts`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw error;
  }
}
