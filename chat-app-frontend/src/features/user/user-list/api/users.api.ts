import type { User } from "@/entities/user";
import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getUsersApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<User[]> {
  const queryParams = toQueryParams(params);
  const url = `/api/users${queryParams}`;

  const response = await apiRequest.get<ApiResponse<User[]>>(url);

  const {
    data: { data },
  } = response;

  return data;
}
