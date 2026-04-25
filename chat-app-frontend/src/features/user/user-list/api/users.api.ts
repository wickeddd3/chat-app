import type { User } from "@/entities/user";
import apiRequest from "@/shared/lib/axios.client";

export async function getUsers(): Promise<Partial<User[]>> {
  try {
    const { data } = await apiRequest({ url: "/api/users" }).get();
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}
