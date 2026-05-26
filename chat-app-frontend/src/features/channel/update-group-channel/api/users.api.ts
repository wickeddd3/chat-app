import type { PaginatedUsers } from "@/entities/user";
import apiRequest from "@/shared/lib/axios.client";

export async function getUsersApi<T>(cursor: T): Promise<PaginatedUsers> {
  try {
    const queryParams = cursor ? `?cursor=${cursor}` : "";
    const url = `/api/users${queryParams}`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}
