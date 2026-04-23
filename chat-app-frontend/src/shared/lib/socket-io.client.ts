import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL;

// Connect to the backend
export const webSocketClient = io(SOCKET_URL, {
  autoConnect: false, // Don't connect until we know the user is logged in
  withCredentials: true, // IMPORTANT: This sends the Better-Auth cookies
});
