import { injectable, inject, multiInject } from "inversify";
import { TYPES } from "@/config/types";
import { Server as SocketServer, type Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { createLogger } from "@/lib/logger";

const log = createLogger("WebSocket");

// Shape populated by socketAuthMiddleware; socket.data is otherwise untyped (any).
interface AuthedSocketData {
  authId: string;
}

@injectable()
export class WebSocketServer {
  private commandRegistry = new Map<string, WebSocketCommand>();

  constructor(
    @inject(TYPES.SocketServer) private webSocketServer: SocketServer,
    @multiInject(TYPES.WebSocketCommand) commands: WebSocketCommand[],
  ) {
    // Build the dynamic command routing index map automatically
    commands.forEach((command) => {
      this.commandRegistry.set(command.eventName, command);
      log.debug({ eventName: command.eventName }, "📡 Registered command router");
    });
  }

  /**
   * Initializes the core connection listener and mounts the dynamic dispatch routine
   */
  public start(): void {
    this.webSocketServer.on("connection", (socket: Socket) => {
      const { authId } = socket.data as AuthedSocketData;
      log.info({ authId, socketId: socket.id }, "🟩 Client connected");

      // Join a private notification room unique to this specific user profile instance
      void socket.join(`user:${authId}`);

      // Listen for incoming triggers from the registry map dynamically
      for (const [eventName, command] of this.commandRegistry.entries()) {
        socket.on(eventName, async (data: unknown) => {
          try {
            await command.execute(socket, authId, data);
          } catch (error) {
            log.error({ err: error, eventName, authId }, "❌ Command runtime crash");
            socket.emit("error", {
              message: `Internal server failure handling action: ${eventName}`,
            });
          }
        });
      }
    });
  }
}
