import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

// Initialize the Admin Client
const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create the user in Supabase Auth
async function createAuthUser(email: string, password: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (error) {
      console.log(`⏩ User ${email} might already exist in Auth.`);
      return null;
    }

    console.log(`✅ Auth User Created: ${email} (${data.user.id})`);
    return data.user.id;
  } catch (err) {
    console.error(`❌ Error creating Auth user ${email}:`, err);
    return null;
  }
}

// Create the profile in the database
async function createProfile(userId: string, email: string, username: string, name: string) {
  try {
    const profile = await prisma.user.upsert({
      where: { id: userId },
      update: {
        username: username,
        email: email,
      },
      create: {
        id: userId,
        email: email,
        username: username,
        name: name,
      },
    });

    if (!profile) {
      console.error(`❌ Failed to upsert profile for ${email}`);
      return null;
    }

    console.log(`📝 Profile upserted for ${username} (${email})`);
    return profile;
  } catch (err) {
    console.error(`❌ Prisma Error for ${userId}:`, err);
    return null;
  }
}

export async function usersSeeder() {
  const count = 10;
  const password = "password123";

  console.log(`Seeding ${String(count)} users...`);

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const username = faker.internet.username({ firstName, lastName }).toLowerCase();
    const email = `${username}@example.com`;

    // 1. Create the user in Supabase Auth
    const userId = await createAuthUser(email, password);
    if (!userId) {
      // If user creation failed (likely due to existing user), skip profile creation
      console.log(`⏩ Skipping user creation for ${email}`);
      continue;
    }

    // 2. Create Profile in Database
    await createProfile(userId, email, username, name);

    console.log(`📝 User created for ${username} (${email})`);
  }

  console.log("✅ Seeding finished successfully.");
}
