import { injectable } from "inversify";
import type { Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { createLogger } from "@/lib/logger";

const log = createLogger("WebSocket");

@injectable()
export class DisconnectCommand implements WebSocketCommand {
  public readonly eventName = "connection:disconnect";

  public execute(socket: Socket, authId: string, _data: unknown): Promise<void> {
    log.info({ authId, socketId: socket.id }, "🟥 Client disconnected");
    return Promise.resolve();
  }
}
