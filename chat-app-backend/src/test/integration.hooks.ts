import { disconnectDb, truncateAll } from "@/test/helpers/db.helper";

// Registered as setupFilesAfterEnv for the integration project, so every
// integration test file gets an isolated database without repeating boilerplate.
beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await disconnectDb();
});
