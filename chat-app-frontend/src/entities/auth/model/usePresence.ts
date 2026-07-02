import { useContext } from "react";
import { PresenceContext } from "./presence-context";

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error("usePresence must be used within PresenceProvider");
  }
  return context;
};
