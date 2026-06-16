import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";

export async function getPresenceMapApi(): Promise<
  Record<string, "online" | "offline">
> {
  const url = "/api/presence/sync-snapshot";

  const response =
    await apiRequest.get<ApiResponse<Record<string, "online" | "offline">>>(
      url,
    );

  const {
    data: { data },
  } = response;

  return data;
}
