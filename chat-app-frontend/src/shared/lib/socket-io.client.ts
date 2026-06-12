import io from "socket.io-client";
import { getAuthToken } from "./supabase-auth";
import { API_URL } from "../config/app.config";

const socketUrl = API_URL;

// Connect to the backend
export const webSocketClient = io(socketUrl, {
  autoConnect: false, // Don't connect until we know the user is logged in
  withCredentials: true,
  auth: {
    token: await getAuthToken(),
  },
});
