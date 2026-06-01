import type { User } from "@/entities/user";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getUsersApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<User[]> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/users${queryParams}`;

    const response = await apiRequest({ url }).get();
    const responseData: ApiResponse = response.data;

    return responseData.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}
