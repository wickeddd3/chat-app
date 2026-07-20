import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";
import {
  invalidateNotificationFilters,
  prependNotification,
  removeNotificationsByReference,
} from "./notification-cache";
import type {
  Notification,
  PaginatedNotifications,
} from "./notification.types";

const keys = createQueryKeys("auth-user");

function notification(id: string, referenceId = `ref-${id}`): Notification {
  return {
    id,
    type: "CONNECTION_REQUEST",
    title: "New connection request",
    content: "Someone wants to connect",
    isRead: false,
    createdAt: "2026-07-21T00:00:00.000Z",
    referenceId,
  };
}

function notificationsData(
  pages: { notifications: Notification[]; total: number }[],
): InfiniteData<PaginatedNotifications> {
  return {
    pages: pages.map(({ notifications, total }) => ({
      notifications,
      total,
      hasMore: false,
      nextCursor: null,
    })),
    pageParams: pages.map(() => null),
  };
}

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

describe("prependNotification", () => {
  it("prepends to the first page and increments the total", () => {
    const qc = new QueryClient();
    const key = keys.notifications.list();
    qc.setQueryData(
      key,
      notificationsData([
        { notifications: [notification("a")], total: 4 },
        { notifications: [notification("b")], total: 4 },
      ]),
    );

    prependNotification(qc, key, notification("new"));

    const data = qc.getQueryData<InfiniteData<PaginatedNotifications>>(key)!;
    expect(data.pages[0].notifications.map((n) => n.id)).toEqual(["new", "a"]);
    expect(data.pages.map((p) => p.total)).toEqual([5, 5]);
  });

  it("is a no-op when the notification is already cached", () => {
    const qc = new QueryClient();
    const key = keys.notifications.list();
    qc.setQueryData(
      key,
      notificationsData([{ notifications: [notification("a")], total: 1 }]),
    );

    prependNotification(qc, key, notification("a"));

    const data = qc.getQueryData<InfiniteData<PaginatedNotifications>>(key)!;
    expect(data.pages[0].notifications).toHaveLength(1);
    expect(data.pages[0].total).toBe(1);
  });
});

describe("removeNotificationsByReference", () => {
  it("drops every match and decrements the total by that count", () => {
    const qc = new QueryClient();
    const key = keys.notifications.list();
    qc.setQueryData(
      key,
      notificationsData([
        {
          notifications: [
            notification("a", "conn-1"),
            notification("b", "conn-2"),
          ],
          total: 6,
        },
        { notifications: [notification("c", "conn-1")], total: 6 },
      ]),
    );

    removeNotificationsByReference(qc, key, "conn-1");

    const data = qc.getQueryData<InfiniteData<PaginatedNotifications>>(key)!;
    expect(data.pages[0].notifications.map((n) => n.id)).toEqual(["b"]);
    expect(data.pages[1].notifications).toHaveLength(0);
    expect(data.pages.map((p) => p.total)).toEqual([4, 4]);
  });

  it("leaves the total alone when nothing matches", () => {
    const qc = new QueryClient();
    const key = keys.notifications.list();
    qc.setQueryData(
      key,
      notificationsData([
        { notifications: [notification("a", "conn-1")], total: 3 },
      ]),
    );

    removeNotificationsByReference(qc, key, "conn-9");

    expect(
      qc.getQueryData<InfiniteData<PaginatedNotifications>>(key)!.pages[0]
        .total,
    ).toBe(3);
  });
});
