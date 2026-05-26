import type { PaginatedInboxChannel } from "@/entities/channel";
import apiRequest from "@/shared/lib/axios.client";
import { toQueryParams } from "@/shared/utils/query-params";

export async function getInboxApi({
  params,
}: {
  params: Record<string, any>;
}): Promise<PaginatedInboxChannel> {
  try {
    const queryParams = toQueryParams(params);
    const url = `/api/channels${queryParams}`;
    const { data } = await apiRequest({ url }).get();

    return data;
  } catch (error) {
    console.error("Error fetching inbox:", error);
    throw error;
  }
}
