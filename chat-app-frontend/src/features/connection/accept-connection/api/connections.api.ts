import apiRequest from "@/shared/lib/axios.client";
import type { Connection } from "@/entities/connection";
import type { ApiResponse } from "@/shared/types/api-response.type";

export async function acceptConnectionRequestApi(
  connectionId: string,
): Promise<Connection> {
  const safeConnectionId = encodeURIComponent(connectionId);
  const url = `/api/connections/request/${safeConnectionId}/accept`;

  const response = await apiRequest.post<ApiResponse<Connection>>(url, {});

  const {
    data: { data },
  } = response;

  return data;
}
