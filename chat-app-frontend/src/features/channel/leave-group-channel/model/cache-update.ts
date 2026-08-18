import {
  inboxListPrefix,
  invalidateInboxFilters,
  removeInboxChannel,
} from "@/entities/channel";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LeaveGroupResult } from "../api/channels.api";

export type TData = LeaveGroupResult;
export type TError = Error;
export type TVariables = {
  channelId: string;
  /** Rendered in the confirmation toast, so the user sees which group they left. */
  channelName?: string;
};
export type TContext = {
  /** Every cached inbox list, keyed for exact restoration on failure. */
  previousInbox: [readonly unknown[], unknown][];
  client: QueryClient;
  keys: ScopedQueryKeys;
};

export async function onMutate(
  variables: TVariables,
  context: { client: QueryClient; keys: ScopedQueryKeys },
): Promise<TContext> {
  const prefix = inboxListPrefix(context.keys);

  // 1. Cancel outbound refetches so they don't overwrite our optimistic state
  await context.client.cancelQueries({ queryKey: prefix });

  // 2. Snapshot every search/filter variant — the row may sit in several at once
  const previousInbox = context.client.getQueriesData({ queryKey: prefix });

  // 3. Optimistically drop the group from the inbox and its tab totals
  removeInboxChannel(context.client, context.keys, variables.channelId);

  return { previousInbox, client: context.client, keys: context.keys };
}

export function onError(
  _err: TError,
  _variables: TVariables,
  context: TContext | undefined,
) {
  // Rollback every list we touched to exactly what it held before
  context?.previousInbox.forEach(([queryKey, data]) => {
    context.client.setQueryData(queryKey, data);
  });

  toast.error("Failed to leave group", {
    description: "Error occurred while leaving the group",
  });
}

export function onSuccess(
  data: TData,
  variables: TVariables,
  context: TContext | undefined,
) {
  const name = variables.channelName ?? "the group";

  // The server decides between the two outcomes (it holds the roster), so report
  // what actually happened rather than what the button predicted.
  toast.success(
    data.channelDeleted ? `${name} was deleted` : `You left ${name}`,
    data.channelDeleted
      ? { description: "You were its last member, so its history is gone." }
      : undefined,
  );

  if (!context) return;

  // The channel is no longer ours to read — drop its detail and timeline rather
  // than leaving a stale copy that a back-navigation could render.
  context.client.removeQueries({
    queryKey: context.keys.channel.details(variables.channelId),
  });
  context.client.removeQueries({
    queryKey: context.keys.messages.timeline(variables.channelId),
  });

  // Leaving changes which channels the server-filtered tabs contain, and any
  // unread the group still held has left the global badge with it.
  invalidateInboxFilters(context.client, ["unread", "groups"]);
  context.client.invalidateQueries({
    queryKey: context.keys.dashboard.badges(),
  });
}
