import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { patchRecommendedUser } from "./user-cache";
import type { User } from "./user.types";

const keys = createQueryKeys("auth-user");

function user(id: string): User {
  return {
    id,
    name: `User ${id}`,
    username: `user${id}`,
    connectionStatus: "STRANGER",
    connectionId: null,
  };
}

const usersAt = (qc: QueryClient, query: string) =>
  qc.getQueryData<User[]>(keys.users.recommended(query))!;

describe("patchRecommendedUser", () => {
  it("patches the user across every cached search variant", () => {
    const qc = new QueryClient();
    qc.setQueryData(keys.users.recommended(""), [user("a"), user("b")]);
    qc.setQueryData(keys.users.recommended("ali"), [user("a")]);

    patchRecommendedUser(qc, keys, "a", {
      connectionStatus: "PENDING_SENT",
      connectionId: "conn-1",
    });

    for (const query of ["", "ali"]) {
      const patched = usersAt(qc, query).find((u) => u.id === "a")!;
      expect(patched.connectionStatus).toBe("PENDING_SENT");
      expect(patched.connectionId).toBe("conn-1");
    }
    // Untargeted users are left as they were.
    expect(usersAt(qc, "")[1].connectionStatus).toBe("STRANGER");
  });

  it("leaves lists that don't contain the user untouched", () => {
    const qc = new QueryClient();
    const before = [user("b")];
    qc.setQueryData(keys.users.recommended("bob"), before);

    patchRecommendedUser(qc, keys, "a", { connectionStatus: "CONTACT" });

    expect(usersAt(qc, "bob")).toBe(before);
  });

  it("ignores unrelated cached lists", () => {
    const qc = new QueryClient();
    const contacts = { pages: [], pageParams: [] };
    qc.setQueryData(keys.connections.contacts(""), contacts);

    patchRecommendedUser(qc, keys, "a", { connectionStatus: "CONTACT" });

    expect(qc.getQueryData(keys.connections.contacts(""))).toBe(contacts);
  });
});
