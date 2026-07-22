import {
  getSuggestedUserIdsFromContacts,
  sortSuggestedUsersByMutualConnections,
  transformUsersIntoSuggestedUsers,
} from "@/modules/user/users.utils";
import type { SuggestedUser, UserWithConnections } from "@/modules/user/users.types";

// Pure suggestion logic — no DB, no mocks.
jest.mock("@/prisma/client", () => ({ PrismaClient: class {} }));

describe("getSuggestedUserIdsFromContacts", () => {
  const me = "me";
  const [a, b] = ["contact-a", "contact-b"]; // my direct contacts

  it("ranks friends-of-friends by how many of my contacts they share", () => {
    // fof1 is connected to both a and b (2 mutual); fof2 only to a (1 mutual).
    const contacts = [
      { senderId: a, receiverId: "fof1" },
      { senderId: b, receiverId: "fof1" },
      { senderId: a, receiverId: "fof2" },
    ];

    const ranked = getSuggestedUserIdsFromContacts({ contacts, directContactIds: [a, b], userId: me });

    expect(ranked).toEqual(["fof1", "fof2"]);
  });

  it("excludes me and my existing direct contacts from suggestions", () => {
    const contacts = [
      { senderId: a, receiverId: b }, // both already my contacts
      { senderId: b, receiverId: me }, // touches me
      { senderId: a, receiverId: "fof" },
    ];

    const ranked = getSuggestedUserIdsFromContacts({ contacts, directContactIds: [a, b], userId: me });

    expect(ranked).toEqual(["fof"]);
  });

  it("returns nothing when there are no second-degree edges", () => {
    expect(getSuggestedUserIdsFromContacts({ contacts: [], directContactIds: [a], userId: me })).toEqual([]);
  });
});

describe("transformUsersIntoSuggestedUsers", () => {
  function user(overrides: Partial<UserWithConnections>): UserWithConnections {
    return {
      id: "u",
      name: "U",
      username: "u",
      image: null,
      sentConnections: [],
      receivedConnections: [],
      ...overrides,
    };
  }

  it("labels an accepted edge as CONTACT and carries its connection id", () => {
    const [result] = transformUsersIntoSuggestedUsers({
      users: [user({ id: "u2", receivedConnections: [{ id: "c1", senderId: "me", status: "ACCEPTED" } as never] })],
      authUserId: "me",
      isInitialLoad: false,
      suggestedUserIds: [],
    });

    expect(result).toMatchObject({ connectionStatus: "CONTACT", connectionId: "c1" });
  });

  it("distinguishes a request I sent from one I received", () => {
    const sent = transformUsersIntoSuggestedUsers({
      users: [user({ id: "u2", receivedConnections: [{ id: "c1", senderId: "me", status: "PENDING" } as never] })],
      authUserId: "me",
      isInitialLoad: false,
      suggestedUserIds: [],
    });
    const received = transformUsersIntoSuggestedUsers({
      users: [user({ id: "u3", sentConnections: [{ id: "c2", receiverId: "me", status: "PENDING" } as never] })],
      authUserId: "me",
      isInitialLoad: false,
      suggestedUserIds: [],
    });

    expect(sent[0]?.connectionStatus).toBe("PENDING_SENT");
    expect(received[0]?.connectionStatus).toBe("PENDING_RECEIVED");
  });

  it("labels a user with no shared edge as STRANGER", () => {
    const [result] = transformUsersIntoSuggestedUsers({
      users: [user({ id: "u2" })],
      authUserId: "me",
      isInitialLoad: false,
      suggestedUserIds: [],
    });

    expect(result).toMatchObject({ connectionStatus: "STRANGER", connectionId: null });
  });
});

describe("sortSuggestedUsersByMutualConnections", () => {
  const mk = (id: string): SuggestedUser => ({
    id,
    name: id,
    username: id,
    image: null,
    connectionStatus: "STRANGER",
    connectionId: null,
    mutualConnectionsCount: 0,
  });

  it("orders users by their position in the ranked id list, pushing unranked to the end", () => {
    const sorted = sortSuggestedUsersByMutualConnections([mk("x"), mk("top"), mk("mid")], ["top", "mid"]);

    expect(sorted.map((u) => u.id)).toEqual(["top", "mid", "x"]);
  });
});
