import { injectable } from "inversify";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";

@injectable()
export class DisconnectCommand implements WebSocketCommand {
  public readonly eventName = "connection:disconnect";

  constructor() {}

  public async execute(socket: Socket, authId: string, _data: unknown): Promise<void> {
    console.log(`🟥 Disconnected: ${authId} (${socket.id})`);
  }
}
