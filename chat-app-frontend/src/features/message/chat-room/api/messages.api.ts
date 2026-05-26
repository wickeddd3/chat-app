import type { PaginatedMessage } from "@/entities/message";
import apiRequest from "@/shared/lib/axios.client";

interface GetMessagesParams {
  channelId: string;
  cursor?: string | unknown;
}

interface GetMessagesApiResponse {
  data: PaginatedMessage;
}

export async function getMessagesApi({
  channelId,
  cursor,
}: GetMessagesParams): Promise<PaginatedMessage> {
  try {
    const queryParams: string = cursor ? `?cursor=${cursor}` : "";
    const url = `/api/messages/${channelId}${queryParams}`;
    const { data }: GetMessagesApiResponse = await apiRequest({ url }).get();

    return data;
  } catch (error: unknown) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}
