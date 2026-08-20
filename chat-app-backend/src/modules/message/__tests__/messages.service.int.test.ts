import { randomUUID } from "crypto";
import { MessagesQuery } from "@/modules/message/persistence/messages.query";
import { MessagesRepository } from "@/modules/message/persistence/messages.repository";
import { prisma } from "@/test/helpers/db.helper";
import {
  addMember,
  createChannel,
  createDirectChannel,
  createMessage,
  createReceipt,
  createUser,
} from "@/test/factories";

const repo = new MessagesRepository(prisma);
const query = new MessagesQuery(prisma);

describe("MessagesRepository (integration, real DB)", () => {
  describe("create", () => {
    it("persists a message and returns it with the author profile and a zero read count", async () => {
      const author = await createUser({ name: "Author" });
      const channel = await createChannel({ authorId: author.id });

      const message = await repo.create({ content: "hello", channelId: channel.id, authorId: author.id });

      expect(message.id).toBeDefined();
      expect(message.content).toBe("hello");
      expect(message.author).toMatchObject({ id: author.id, name: "Author" });
      expect(message.readCount).toBe(0);

      const persisted = await prisma.message.findUnique({ where: { id: message.id } });
      expect(persisted).not.toBeNull();
      expect(message.parent).toBeNull();
    });

    it("persists a reply and returns the quoted parent with it", async () => {
      const author = await createUser({ name: "Author" });
      const channel = await createChannel({ authorId: author.id });
      const parent = await createMessage({ channelId: channel.id, authorId: author.id, content: "original" });

      const reply = await repo.create({
        content: "quoting you",
        channelId: channel.id,
        authorId: author.id,
        parentId: parent.id,
      });

      expect(reply.parentId).toBe(parent.id);
      expect(reply.parent).toMatchObject({
        id: parent.id,
        content: "original",
        author: { id: author.id, name: "Author" },
      });
    });
  });
});

describe("MessagesQuery (integration, real DB)", () => {
  describe("getMessages (keyset pagination)", () => {
    it("returns the page oldest-first and walks every message with no skips/dupes", async () => {
      const author = await createUser();
      const channel = await createChannel({ authorId: author.id });

      const base = Date.UTC(2026, 0, 1);
      for (let i = 0; i < 25; i++) {
        await createMessage({
          channelId: channel.id,
          authorId: author.id,
          content: `m${String(i)}`,
          createdAt: new Date(base + i * 60_000),
        });
      }

      const seen: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      for (;;) {
        const page = await query.getMessages({ channelId: channel.id, limit: 10, ...(cursor && { cursor }) });
        // Each page is ascending (oldest first) for display.
        const times = page.messages.map((m) => m.createdAt.getTime());
        expect([...times].sort((a, b) => a - b)).toEqual(times);
        page.messages.forEach((m) => seen.push(m.id));
        pages++;
        if (!page.hasMore || !page.nextCursor) break;
        cursor = page.nextCursor;
      }

      expect(seen).toHaveLength(25);
      expect(new Set(seen).size).toBe(25);
      expect(pages).toBe(3);
    });

    it("does not skip messages that share the same createdAt", async () => {
      const author = await createUser();
      const channel = await createChannel({ authorId: author.id });

      // 15 messages, 5 sharing each of 3 timestamps — the collision case.
      const base = Date.UTC(2026, 0, 1);
      for (let i = 0; i < 15; i++) {
        await createMessage({
          channelId: channel.id,
          authorId: author.id,
          createdAt: new Date(base + Math.floor(i / 5) * 60_000),
        });
      }

      const seen = new Set<string>();
      let cursor: string | undefined;
      for (;;) {
        const page = await query.getMessages({ channelId: channel.id, limit: 6, ...(cursor && { cursor }) });
        page.messages.forEach((m) => seen.add(m.id));
        if (!page.hasMore || !page.nextCursor) break;
        cursor = page.nextCursor;
      }

      expect(seen.size).toBe(15);
    });

    it("carries the recipient read count on each message", async () => {
      const [alice, bob] = [await createUser(), await createUser()];
      const channel = await createDirectChannel(alice.id, bob.id);
      const message = await createMessage({ channelId: channel.id, authorId: alice.id });
      await createReceipt(message.id, bob.id);

      const page = await query.getMessages({ channelId: channel.id });
      expect(page.messages.find((m) => m.id === message.id)?.readCount).toBe(1);
    });

    it("carries the quoted parent on a reply and null on everything else", async () => {
      const [alice, bob] = [await createUser({ name: "Alice" }), await createUser()];
      const channel = await createDirectChannel(alice.id, bob.id);
      const parent = await createMessage({ channelId: channel.id, authorId: alice.id, content: "original" });
      const reply = await createMessage({ channelId: channel.id, authorId: bob.id, parentId: parent.id });

      const page = await query.getMessages({ channelId: channel.id });

      expect(page.messages.find((m) => m.id === reply.id)?.parent).toMatchObject({
        id: parent.id,
        content: "original",
        author: { name: "Alice" },
      });
      expect(page.messages.find((m) => m.id === parent.id)?.parent).toBeNull();
    });
  });

  describe("getChannelIdOf", () => {
    it("reports where a message lives, and null for one that does not exist", async () => {
      const author = await createUser();
      const channel = await createChannel({ authorId: author.id });
      const message = await createMessage({ channelId: channel.id, authorId: author.id });

      await expect(query.getChannelIdOf(message.id)).resolves.toBe(channel.id);
      await expect(query.getChannelIdOf(randomUUID())).resolves.toBeNull();
    });
  });

  describe("getUnreadMessages", () => {
    it("returns only unread messages from OTHER users in the given channel", async () => {
      const [alice, bob] = [await createUser(), await createUser()];
      const channel = await createDirectChannel(alice.id, bob.id);

      const own = await createMessage({ channelId: channel.id, authorId: alice.id });
      const readMsg = await createMessage({ channelId: channel.id, authorId: bob.id });
      const unreadMsg = await createMessage({ channelId: channel.id, authorId: bob.id });
      await createReceipt(readMsg.id, alice.id); // alice already read this one

      const unread = await query.getUnreadMessages(channel.id, alice.id);
      const ids = unread.map((m) => m.id);

      expect(ids).toContain(unreadMsg.id);
      expect(ids).not.toContain(readMsg.id); // already read
      expect(ids).not.toContain(own.id); // own message
      expect(ids).toHaveLength(1);
    });

    it("is scoped to the channel — a different channel's unread never leaks in", async () => {
      const [alice, bob] = [await createUser(), await createUser()];
      const channelA = await createChannel({ authorId: alice.id });
      const channelB = await createChannel({ authorId: alice.id });
      await addMember(channelA.id, bob.id);
      await addMember(channelB.id, bob.id);

      await createMessage({ channelId: channelA.id, authorId: bob.id });
      await createMessage({ channelId: channelB.id, authorId: bob.id });

      const unreadA = await query.getUnreadMessages(channelA.id, alice.id);
      expect(unreadA).toHaveLength(1); // only channel A's message, never B's
    });
  });
});
