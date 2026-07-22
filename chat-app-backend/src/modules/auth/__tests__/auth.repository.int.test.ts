import { randomUUID } from "crypto";
import { AuthRepository } from "@/modules/auth/persistence/auth.repository";
import { prisma } from "@/test/helpers/db.helper";
import { createUser } from "@/test/factories";

const repo = new AuthRepository(prisma);

describe("AuthRepository (integration, real DB)", () => {
  describe("create", () => {
    it("creates the profile row under the supplied (Supabase) id", async () => {
      const id = randomUUID();

      const user = await repo.create({ id, name: "Jane", username: `jane-${id.slice(0, 8)}` });

      expect(user).toMatchObject({ id, name: "Jane" });
      expect(await prisma.user.findUnique({ where: { id } })).not.toBeNull();
    });

    it("surfaces a duplicate username as a conflict, not an opaque 500", async () => {
      const username = "taken-handle";
      await createUser({ username });

      await expect(repo.create({ id: randomUUID(), name: "Other", username })).rejects.toMatchObject({
        code: "CONFLICT",
      });
    });
  });

  describe("getById", () => {
    it("returns the row for a known id and null for an unknown one", async () => {
      const user = await createUser({ name: "Known" });

      expect(await repo.getById(user.id)).toMatchObject({ id: user.id, name: "Known" });
      expect(await repo.getById(randomUUID())).toBeNull();
    });
  });

  describe("updateProfile / updateImage", () => {
    it("updates the name and username", async () => {
      const user = await createUser();

      const updated = await repo.updateProfile(user.id, { name: "Renamed", username: "renamed-handle" });

      expect(updated).toMatchObject({ name: "Renamed", username: "renamed-handle" });
    });

    it("updates the image", async () => {
      const user = await createUser();

      const updated = await repo.updateImage(user.id, { image: "https://cdn.example/a.png" });

      expect(updated.image).toBe("https://cdn.example/a.png");
    });

    it("reports an update to a non-existent user as not found", async () => {
      await expect(repo.updateProfile(randomUUID(), { name: "Ghost", username: "ghost-handle" })).rejects.toMatchObject(
        { code: "NOT_FOUND" },
      );
    });
  });
});
