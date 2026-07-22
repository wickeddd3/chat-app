import { MessageReceiptsRepository } from "@/modules/message/persistence/message-receipts.repository";
import { prisma } from "@/test/helpers/db.helper";
import { createDirectChannel, createMessage, createUser } from "@/test/factories";

const repo = new MessageReceiptsRepository(prisma);

describe("MessageReceiptsRepository (integration, real DB)", () => {
  it("records receipts for the given messages and reports how many were created", async () => {
    const [alice, bob] = [await createUser(), await createUser()];
    const channel = await createDirectChannel(alice.id, bob.id);
    const [m1, m2] = [
      await createMessage({ channelId: channel.id, authorId: alice.id }),
      await createMessage({ channelId: channel.id, authorId: alice.id }),
    ];

    const { count } = await repo.createMessageReceipts(bob.id, [m1.id, m2.id]);

    expect(count).toBe(2);
    expect(await prisma.messageReceipt.count({ where: { userId: bob.id } })).toBe(2);
  });

  it("is idempotent — re-reading already-read messages creates nothing", async () => {
    const [alice, bob] = [await createUser(), await createUser()];
    const channel = await createDirectChannel(alice.id, bob.id);
    const message = await createMessage({ channelId: channel.id, authorId: alice.id });

    await repo.createMessageReceipts(bob.id, [message.id]);
    const { count } = await repo.createMessageReceipts(bob.id, [message.id]);

    expect(count).toBe(0); // skipDuplicates → the second read is a no-op
    expect(await prisma.messageReceipt.count({ where: { messageId: message.id } })).toBe(1);
  });
});
