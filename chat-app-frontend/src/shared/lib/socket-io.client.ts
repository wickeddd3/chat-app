import io from "socket.io-client";
import { getAuthToken } from "./supabase-auth";

const SOCKET_URL = import.meta.env.VITE_API_URL;

// Connect to the backend
export const webSocketClient = io(SOCKET_URL, {
  autoConnect: false, // Don't connect until we know the user is logged in
  withCredentials: true,
  auth: {
    token: await getAuthToken(),
  },
});
