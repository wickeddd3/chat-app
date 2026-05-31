import type { User } from "@/entities/user";
import apiRequest from "@/shared/lib/axios.client";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getUsersApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<User[]> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/users${queryParams}`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}
