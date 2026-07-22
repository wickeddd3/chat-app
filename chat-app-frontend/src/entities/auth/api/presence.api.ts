import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import { toQueryParams, type QueryParams } from "@/shared/utils/query-params";
import type { PresenceEntry } from "../model/presence-context";

export async function getPresenceMapApi({
  params,
}: {
  params: QueryParams;
}): Promise<Record<string, PresenceEntry>> {
  const queryParams = toQueryParams(params);
  const url = `/api/presence/sync-snapshot${queryParams}`;

  const response =
    await apiRequest.get<ApiResponse<Record<string, PresenceEntry>>>(url);

  const {
    data: { data },
  } = response;

  return data;
}
