import React, { createContext, useContext, useEffect, useState } from "react";
import { webSocketClient } from "@/shared/lib/socket-io.client";

interface PresenceContextType {
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextType | undefined>(
  undefined,
);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 1. Listen for individual status changes
    const handleStatusChange = ({
      userId,
      status,
    }: {
      userId: string;
      status: "online" | "offline";
    }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (status === "online") newSet.add(userId);
        else newSet.delete(userId);
        return newSet;
      });
    };

    // 2. Optional: Initial sync (Server sends the full list upon connection)
    const handleInitialList = (userIds: string[]) => {
      setOnlineUsers(new Set(userIds));
    };

    webSocketClient.on("user_status_change", handleStatusChange);
    webSocketClient.on("online_users_list", handleInitialList);

    return () => {
      webSocketClient.off("user_status_change", handleStatusChange);
      webSocketClient.off("online_users_list", handleInitialList);
    };
  }, []);

  const isOnline = (userId: string) => onlineUsers.has(userId);

  return (
    <PresenceContext.Provider value={{ onlineUsers, isOnline }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context)
    throw new Error("usePresence must be used within PresenceProvider");
  return context;
};
