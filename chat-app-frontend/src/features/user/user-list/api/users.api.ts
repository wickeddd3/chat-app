import type { PaginatedUsers } from "@/entities/user";
import apiRequest from "@/shared/lib/axios.client";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getUsers({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedUsers> {
  try {
    const queryParams = toQueryParams(params);
    const { data } = await apiRequest({
      url: `/api/users${queryParams}`,
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}
