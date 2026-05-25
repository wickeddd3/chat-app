import { useQuery } from "@tanstack/react-query";
import { getContactsApi } from "../api/connections.api";
import type { ConnectionUser } from "@/entities/connection";

export function useContacts(): {
  contacts: ConnectionUser[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useQuery<ConnectionUser[], unknown>({
    queryKey: ["contacts"],
    queryFn: getContactsApi,
  });

  const contacts = data ?? [];

  return {
    contacts,
    isLoading,
    isEmpty: !isLoading && contacts.length === 0,
    error,
  };
}
