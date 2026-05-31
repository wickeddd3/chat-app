import { Socket } from "socket.io";
import type { User } from "@/prisma/client";

export interface WebSocketCommand {
  readonly eventName: string;

  execute(socket: Socket, user: User, data: any): Promise<void> | void;
}
