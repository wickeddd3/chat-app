import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams, type QueryParams } from "@/shared/utils/query-params";

export async function getPresenceMapApi({
  params,
}: {
  params: QueryParams;
}): Promise<Record<string, "online" | "offline">> {
  const queryParams = toQueryParams(params);
  const url = `/api/presence/sync-snapshot${queryParams}`;

  const response =
    await apiRequest.get<ApiResponse<Record<string, "online" | "offline">>>(
      url,
    );

  const {
    data: { data },
  } = response;

  return data;
}
