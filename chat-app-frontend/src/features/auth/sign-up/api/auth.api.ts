import apiRequest from "@/shared/lib/axios.client";
import type { User } from "@/entities/user";
import type { ApiResponse } from "@/shared/types/api-response.type";
import type { SignUpFormSchemaType } from "../model/schema";

export async function signUpApi(formData: SignUpFormSchemaType): Promise<User> {
  const url = "/api/auth/sign-up";

  const response = await apiRequest.post<ApiResponse<User>>(url, formData);

  const {
    data: { data },
  } = response;

  return data;
}
