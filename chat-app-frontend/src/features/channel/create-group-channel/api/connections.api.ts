import type { PaginatedContacts } from "@/entities/connection";
import apiRequest from "@/shared/lib/axios.client";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getContactsApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedContacts> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/connections/contacts${queryParams}`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw error;
  }
}
