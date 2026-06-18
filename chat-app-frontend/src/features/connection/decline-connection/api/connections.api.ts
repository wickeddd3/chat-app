import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";

export async function declineConnectionRequestApi({
  connectionRequestId,
}: {
  connectionRequestId: string;
  connectionRequestUserId: string;
}): Promise<string> {
  const safeId = encodeURIComponent(connectionRequestId);
  const url = `/api/connections/request/${safeId}/decline`;

  const response = await apiRequest.post<ApiResponse<string>>(url, {});

  const {
    data: { data },
  } = response;

  return data;
}
