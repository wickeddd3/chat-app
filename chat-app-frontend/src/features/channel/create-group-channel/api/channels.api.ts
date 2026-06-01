import apiRequest from "@/shared/lib/axios.client";
import type { Channel } from "@/entities/channel";
import type { ApiResponse } from "@/shared/types/api-response.type";

export async function createGroupChannelApi(formData: {
  name: string;
  memberIds: string[];
}): Promise<Channel> {
  const url = "/api/channels/group";

  const response = await apiRequest.post<ApiResponse<Channel>>(url, formData);

  const {
    data: { data },
  } = response;

  return data;
}
