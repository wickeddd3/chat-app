import {
  contactsListPrefix,
  removeContactFromLists,
} from "@/entities/connection";
import { closeDirectChannelWith } from "@/entities/channel";
import { patchRecommendedUser } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type TData = string;
export type TError = Error;
export type TVariables = {
  contactUserId: string;
  /** Rendered in the confirmation toasts, so the user sees who was removed. */
  contactName?: string;
};
export type TContext = {
  /** Every cached contacts list, keyed for exact restoration on failure. */
  previousContacts: [readonly unknown[], unknown][];
  client: QueryClient;
  keys: ScopedQueryKeys;
};

export async function onMutate(
  variables: TVariables,
  context: { client: QueryClient; keys: ScopedQueryKeys },
): Promise<TContext> {
  const prefix = contactsListPrefix(context.keys);

  // 1. Cancel outbound refetches so they don't overwrite our optimistic state
  await context.client.cancelQueries({ queryKey: prefix });

  // 2. Snapshot every search-query variant — the row may be cached in several of
  // them, so a single key wouldn't be enough to roll back cleanly.
  const previousContacts = context.client.getQueriesData({ queryKey: prefix });

  // 3. Optimistically drop the contact from those lists and their tab totals
  removeContactFromLists(context.client, context.keys, variables.contactUserId);

  return { previousContacts, client: context.client, keys: context.keys };
}

export function onError(
  _err: TError,
  _variables: TVariables,
  context: TContext | undefined,
) {
  // Rollback every list we touched to exactly what it held before
  context?.previousContacts.forEach(([queryKey, data]) => {
    context.client.setQueryData(queryKey, data);
  });

  toast.error("Failed to remove contact", {
    description: "Error occurred while removing the contact",
  });
}

export function onSuccess(
  _data: TData,
  variables: TVariables,
  context: TContext | undefined,
) {
  toast.success(
    variables.contactName
      ? `${variables.contactName} removed from contacts`
      : "Contact removed",
    { description: "You can no longer message each other." },
  );

  if (!context) return;

  // The pair are strangers again — a fresh request may be sent from any user list.
  patchRecommendedUser(context.client, context.keys, variables.contactUserId, {
    connectionStatus: "STRANGER",
    connectionId: null,
  });

  // Close the composer on their direct thread if it happens to be open. The
  // history stays: only sending is withdrawn.
  closeDirectChannelWith(context.client, variables.contactUserId);
}
