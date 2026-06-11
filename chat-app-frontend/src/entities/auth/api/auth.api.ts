import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";
import type { AuthUser } from "../model/auth.types";

export async function getAuthProfile(): Promise<AuthUser> {
  const url = "/api/auth";

  const response = await apiRequest.get<ApiResponse<AuthUser>>(url);

  const {
    data: { data },
  } = response;

  return data;
}
