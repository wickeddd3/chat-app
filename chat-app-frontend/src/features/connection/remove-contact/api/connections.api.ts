import apiRequest from "@/shared/lib/axios.client";
import type { ApiResponse } from "@/shared/types/api-response.type";

/**
 * Dissolves the connection with `contactUserId`. Addressed by user rather than
 * by connection id — the contacts list and the chat room both know who they are
 * looking at, not which row joins them.
 *
 * Resolves to the id of the deleted connection.
 */
export async function removeContactApi({
  contactUserId,
}: {
  contactUserId: string;
}): Promise<string> {
  const safeId = encodeURIComponent(contactUserId);
  const url = `/api/connections/contacts/${safeId}`;

  const response = await apiRequest.delete<ApiResponse<string>>(url);

  const {
    data: { data },
  } = response;

  return data;
}
