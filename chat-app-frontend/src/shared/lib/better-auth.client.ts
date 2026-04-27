import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

const API_URL = import.meta.env.VITE_API_URL;

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    credentials: "include", // Include cookies in requests for session management
  },
  plugins: [usernameClient()],
});
