import type { PaginatedUsers } from "@/entities/user";
import apiRequest from "@/shared/lib/axios.client";

export async function getUsers<T>(cursor: T): Promise<PaginatedUsers> {
  try {
    const queryParams = cursor ? `?cursor=${cursor}` : "";
    const { data } = await apiRequest({
      url: `/api/users${queryParams}`,
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}
