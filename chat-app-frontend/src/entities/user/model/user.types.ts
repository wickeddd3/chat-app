export interface User {
  id: string;
  name: string;
  username: string;
  image?: string;
  connectionStatus:
    "STRANGER" | "CONTACT" | "PENDING_SENT" | "PENDING_RECEIVED";
  connectionId: string | null;
}
