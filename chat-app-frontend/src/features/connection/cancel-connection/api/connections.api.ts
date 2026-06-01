import apiRequest from "@/shared/lib/axios.client";
import type { Channel } from "@/entities/channel";
import type { ApiResponse } from "@/shared/types/api-response.type";

export async function cancelConnectionRequestApi(id: string): Promise<Channel> {
  const safeId = encodeURIComponent(id);
  const url = `/api/connections/request/${safeId}/cancel`;

  const response = await apiRequest.post<ApiResponse<Channel>>(url, {});

  const {
    data: { data },
  } = response;

  return data;
}
