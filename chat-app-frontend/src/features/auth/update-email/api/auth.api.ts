import apiRequest from "@/shared/lib/axios.client";
import type { User } from "@/entities/user";
import type { ApiResponse } from "@/shared/types/api-response.type";
import type { EmailFormSchemaType } from "../model/schema";

export async function updateEmailApi(
  formData: EmailFormSchemaType,
): Promise<User> {
  const url = "/api/auth/email";

  const response = await apiRequest.post<ApiResponse<User>>(url, formData);

  const {
    data: { data },
  } = response;

  return data;
}
