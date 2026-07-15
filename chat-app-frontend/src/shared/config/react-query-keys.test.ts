import { createQueryKeys } from "./react-query-keys";

describe("createQueryKeys", () => {
  it("scopes every key under the given authId", () => {
    const keys = createQueryKeys("user-1");

    expect(keys.presence.matrix()).toEqual([
      "user-1",
      "presence",
      "matrix",
      "global",
    ]);
    expect(keys.auth.profile()).toEqual(["user-1", "auth", "profile"]);
    expect(keys.dashboard.badges()).toEqual(["user-1", "dashboard", "badges"]);
    expect(keys.notifications.list()).toEqual([
      "user-1",
      "notifications",
      "list",
      "all",
    ]);
    expect(keys.notifications.list("unread")).toEqual([
      "user-1",
      "notifications",
      "list",
      "unread",
    ]);
  });

  it('falls back to the "anonymous" scope when authId is undefined', () => {
    const keys = createQueryKeys(undefined);

    expect(keys.auth.profile()).toEqual(["anonymous", "auth", "profile"]);
  });

  it("keeps two different users' keys from colliding", () => {
    const userAKeys = createQueryKeys("user-a");
    const userBKeys = createQueryKeys("user-b");

    expect(userAKeys.dashboard.badges()).not.toEqual(
      userBKeys.dashboard.badges(),
    );
  });

  describe("keys that accept extra parameters", () => {
    it("threads channelId through presence.matrix, defaulting to 'global'", () => {
      const keys = createQueryKeys("user-1");

      expect(keys.presence.matrix("channel-1")).toEqual([
        "user-1",
        "presence",
        "matrix",
        "channel-1",
      ]);
      expect(keys.presence.matrix()).toEqual([
        "user-1",
        "presence",
        "matrix",
        "global",
      ]);
    });

    it("threads a search query through inbox.list and connections.contacts", () => {
      const keys = createQueryKeys("user-1");

      expect(keys.inbox.list("jane")).toEqual([
        "user-1",
        "inbox",
        "list",
        "jane",
        "all",
      ]);
      expect(keys.inbox.list("jane", "unread")).toEqual([
        "user-1",
        "inbox",
        "list",
        "jane",
        "unread",
      ]);
      expect(keys.connections.contacts("jane")).toEqual([
        "user-1",
        "connections",
        "contacts",
        "jane",
      ]);
    });

    it("threads channelId through channel.details and messages.timeline", () => {
      const keys = createQueryKeys("user-1");

      expect(keys.channel.details("channel-1")).toEqual([
        "user-1",
        "channel",
        "details",
        "channel-1",
      ]);
      expect(keys.messages.timeline("channel-1")).toEqual([
        "user-1",
        "messages",
        "timeline",
        "channel-1",
      ]);
    });
  });
});
