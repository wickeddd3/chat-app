import io from "socket.io-client";

// Connect to the websocket backend
const socket = io(`${import.meta.env.VITE_API_URL}`);

export { socket };
