import io from "socket.io-client";
import { getAuthToken } from "./supabase-auth";
import { API_URL } from "../config/app.config";

const socketUrl = API_URL;

// Connect to the backend
export const webSocketClient = io(socketUrl, {
  autoConnect: false, // Don't connect until we know the user is logged in
  withCredentials: true,
  auth: (callback) => {
    // Resolved fresh on every (re)connection attempt so token refreshes/expiry are respected
    getAuthToken()
      .then((token) => {
        callback({ token });
      })
      .catch(() => {
        callback({ token: "" });
      });
  },
});
