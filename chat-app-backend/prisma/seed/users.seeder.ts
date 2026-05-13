import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import { hashPassword } from "better-auth/crypto";

export async function usersSeeder() {
  const count = 10;
  const password = "password123";
  const hashed = await hashPassword(password);

  console.log(`Seeding ${count} users...`);

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.username({ firstName, lastName }).toLowerCase();
    const email = `${username}@example.com`;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: faker.string.uuid(),
          name: `${firstName} ${lastName}`,
          email: email,
          username: username,
          displayUsername: username,
          emailVerified: true,
          image: faker.image.avatar(),
        },
      });

      const account = await tx.account.create({
        data: {
          id: faker.string.uuid(),
          accountId: user.id,
          userId: user.id,
          providerId: "credential",
          password: hashed,
        },
      });

      console.log(`📝 User created for ${username} (${email})`);
    });
  }

  console.log("✅ Seeding finished successfully.");
}
