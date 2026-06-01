import apiRequest from "@/shared/lib/axios.client";
import type { Connection } from "@/entities/connection";
import type { ApiResponse } from "@/shared/types/api-response.type";

export async function sendConnectionRequestApi(formData: {
  receiverId: string;
}): Promise<Connection> {
  const url = "/api/connections/request";

  const response = await apiRequest.post<ApiResponse<Connection>>(
    url,
    formData,
  );

  const {
    data: { data },
  } = response;

  return data;
}
