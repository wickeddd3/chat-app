import { QueryClient } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import { invalidateNotificationFilters } from "./notification-cache";

const keys = createQueryKeys("auth-user");

describe("invalidateNotificationFilters", () => {
  it("invalidates only the named filter lists, leaving 'all' untouched", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");

    invalidateNotificationFilters(qc, ["unread"]);

    const predicate = spy.mock.calls[0][0]?.predicate as
      ((q: { queryKey: readonly unknown[] }) => boolean) | undefined;
    expect(predicate).toBeTypeOf("function");

    const matches = (key: readonly unknown[]) => predicate!({ queryKey: key });

    expect(matches(keys.notifications.list("unread"))).toBe(true);
    expect(matches(keys.notifications.list("all"))).toBe(false);
    // Unrelated lists are never touched.
    expect(matches(keys.inbox.list("", "unread"))).toBe(false);
  });
});
