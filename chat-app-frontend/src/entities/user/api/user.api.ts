import type { User } from "@/entities/user";
import apiRequest from "@/shared/lib/axios.client";

export async function getUserByUsername(
  username: string,
): Promise<Partial<User>> {
  try {
    const { data } = await apiRequest({
      url: `/api/users/profile/${username}`,
    }).get();
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}
