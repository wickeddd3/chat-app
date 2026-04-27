import { authClient } from "@/shared/lib/better-auth.client";
import type { ProfileFormSchemaType } from "./schema";

export function useProfile() {
  const updateUser = async ({
    name,
    username,
  }: ProfileFormSchemaType): Promise<any> => {
    const response = await authClient.updateUser({
      name,
      username,
    });
    return response;
  };

  return { updateUser };
}
