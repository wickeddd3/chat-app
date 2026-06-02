import type { Socket } from "socket.io";
import type { User } from "@/prisma/client";

export interface WebSocketCommand<TPayload = any> {
  readonly eventName: string;

  execute(socket: Socket, user: User, data: TPayload): Promise<void> | void;
}
