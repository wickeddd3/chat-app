import apiRequest from "@/shared/lib/axios.client";
import type { User } from "@/entities/user";
import type { ApiResponse } from "@/shared/types/api-response.type";

export async function updateImageApi(formData: {
  image: string | null;
}): Promise<User> {
  const url = "/api/auth/image";

  const response = await apiRequest.post<ApiResponse<User>>(url, formData);

  const {
    data: { data },
  } = response;

  return data;
}
