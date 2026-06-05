import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { APP_URL, BETTER_AUTH_URL } from "@/config/app.config";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [APP_URL],
  baseURL: BETTER_AUTH_URL,
  trustProxy: true,
  advanced: {
    useSecureCookies: true,
  },
  cookie: {
    secure: true,
    sameSite: "lax",
  },
  session: {
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // 1 day in seconds
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
    additionalFields: {
      lastSeen: {
        type: "date",
        required: false,
        input: false,
        defaultValue: null,
      },
    },
  },
  plugins: [
    username({
      minUsernameLength: 6,
      maxUsernameLength: 100,
      displayUsernameValidator: (displayUsername) => {
        // Allow only alphanumeric characters, underscores, and hyphens
        return /^[a-zA-Z0-9_-]+$/.test(displayUsername);
      },
    }),
  ],
});
