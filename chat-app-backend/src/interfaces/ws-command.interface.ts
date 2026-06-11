import type { Socket } from "socket.io";

export interface WebSocketCommand<TPayload = unknown> {
  readonly eventName: string;

  execute(socket: Socket, authId: string, data: TPayload): Promise<void> | void;
}
