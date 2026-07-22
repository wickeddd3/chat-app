import { TYPES } from "@/config/types";
import { AuthService } from "@/modules/auth/auth.service";
import { buildTestContainer } from "@/test/helpers/container.helper";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
jest.mock("@/lib/redis", () => ({ redisClient: {}, pubClient: {}, subClient: {}, connectRedis: jest.fn() }));
jest.mock("@/prisma/client", () => ({ PrismaClient: class {}, Prisma: { PrismaClientKnownRequestError: class {} } }));

/** A Supabase auth double exposing only the surface the service touches. */
function buildSupabase() {
  return {
    auth: {
      signUp: jest.fn(),
      admin: { deleteUser: jest.fn().mockResolvedValue({ data: null, error: null }) },
    },
  };
}

const validSignUp = { name: "Jane", username: "JaneDoe", email: "jane@example.com", password: "password123" };

describe("AuthService (DI container + mocked repository/supabase)", () => {
  let repo: { create: jest.Mock; getById: jest.Mock; updateProfile: jest.Mock; updateImage: jest.Mock };
  let supabase: ReturnType<typeof buildSupabase>;
  let service: AuthService;

  beforeEach(() => {
    repo = { create: jest.fn(), getById: jest.fn(), updateProfile: jest.fn(), updateImage: jest.fn() };
    supabase = buildSupabase();
    const container = buildTestContainer([
      [TYPES.AuthRepository, repo],
      [TYPES.SupabaseClient, supabase],
    ]);
    container.bind<AuthService>(TYPES.AuthService).to(AuthService);
    service = container.get<AuthService>(TYPES.AuthService);
  });

  describe("createUser", () => {
    it("provisions Supabase then mirrors the profile with the shared id and a lower-cased username", async () => {
      supabase.auth.signUp.mockResolvedValue({ data: { user: { id: "sb-1" } }, error: null });
      const created = { id: "sb-1", name: "Jane", username: "janedoe" };
      repo.create.mockResolvedValue(created);

      await expect(service.createUser(validSignUp)).resolves.toBe(created);
      expect(repo.create).toHaveBeenCalledWith({ id: "sb-1", name: "Jane", username: "janedoe" });
      expect(supabase.auth.admin.deleteUser).not.toHaveBeenCalled();
    });

    it("maps a duplicate-account Supabase error to a conflict and never writes a profile", async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "User already registered", status: 422 },
      });

      await expect(service.createUser(validSignUp)).rejects.toMatchObject({ code: "CONFLICT" });
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("maps a client-side Supabase rejection (e.g. weak password) to a validation error", async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "Password should be at least 8 characters", status: 422 },
      });

      await expect(service.createUser(validSignUp)).rejects.toMatchObject({ code: "VALIDATION" });
    });

    it("rolls back the orphaned Supabase account when the profile write fails, and rethrows the domain error", async () => {
      supabase.auth.signUp.mockResolvedValue({ data: { user: { id: "sb-1" } }, error: null });
      const conflict = Object.assign(new Error("username taken"), { code: "CONFLICT" });
      repo.create.mockRejectedValue(conflict);

      await expect(service.createUser(validSignUp)).rejects.toBe(conflict);
      expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith("sb-1");
    });

    it("does not fail with the cleanup error if the rollback itself fails", async () => {
      supabase.auth.signUp.mockResolvedValue({ data: { user: { id: "sb-1" } }, error: null });
      const original = Object.assign(new Error("db down"), { code: "PERSISTENCE" });
      repo.create.mockRejectedValue(original);
      supabase.auth.admin.deleteUser.mockRejectedValue(new Error("supabase unreachable"));

      // The caller sees the original failure, not the cleanup failure.
      await expect(service.createUser(validSignUp)).rejects.toBe(original);
    });
  });

  it("getUserById / updateUserProfile / updateUserImage delegate to the repository", async () => {
    repo.getById.mockResolvedValue({ id: "u1" });
    repo.updateProfile.mockResolvedValue({ id: "u1", name: "New" });
    repo.updateImage.mockResolvedValue({ id: "u1", image: "img" });

    await expect(service.getUserById("u1")).resolves.toEqual({ id: "u1" });
    await expect(service.updateUserProfile("u1", { name: "New", username: "new" })).resolves.toEqual({
      id: "u1",
      name: "New",
    });
    await expect(service.updateUserImage("u1", { image: "img" })).resolves.toEqual({ id: "u1", image: "img" });
  });
});
