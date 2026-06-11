import apiRequest from "@/shared/lib/axios.client";
import type { User } from "@/entities/user";
import type { ApiResponse } from "@/shared/types/api-response.type";
import type { ProfileFormSchemaType } from "../model/schema";

export async function updateProfileApi(
  formData: ProfileFormSchemaType,
): Promise<User> {
  const url = "/api/auth/profile";

  const response = await apiRequest.post<ApiResponse<User>>(url, formData);

  const {
    data: { data },
  } = response;

  return data;
}
