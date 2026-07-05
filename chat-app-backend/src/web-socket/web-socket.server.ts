import { injectable, inject, multiInject } from "inversify";
import { TYPES } from "@/config/types";
import { Server as SocketServer, type Socket } from "socket.io";
import { WebSocketCommand } from "@/interfaces/ws-command.interface";
import { createLogger } from "@/lib/logger";
import { newBucket, tryConsume, type TokenBucket } from "./rate-limit";

const log = createLogger("WebSocket");

// Shape populated by socketAuthMiddleware + this server; socket.data is
// otherwise untyped (any).
interface AuthedSocketData {
  authId: string;
  rateLimit: TokenBucket;
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
   * Initializes the core connection listener and mounts the dynamic dispatch
   * routine. Every inbound event passes through a per-socket rate limiter and
   * (when the command declares one) zod payload validation before the handler.
   */
  public start(): void {
    this.webSocketServer.on("connection", (socket: Socket) => {
      const data = socket.data as AuthedSocketData;
      const { authId } = data;
      // Per-connection token bucket for inbound-event rate limiting.
      data.rateLimit = newBucket();
      log.info({ authId, socketId: socket.id }, "🟩 Client connected");

      // Join a private notification room unique to this specific user profile instance
      void socket.join(`user:${authId}`);

      // Listen for incoming triggers from the registry map dynamically
      for (const [eventName, command] of this.commandRegistry.entries()) {
        socket.on(eventName, async (payload: unknown) => {
          // 1. Rate limit — drop floods before doing any work.
          if (!tryConsume(data.rateLimit)) {
            socket.emit("error", { code: "RATE_LIMITED", event: eventName, message: "Too many actions, slow down." });
            return;
          }

          // 2. Validate the payload at the boundary when a schema is declared.
          let input = payload;
          if (command.schema) {
            const result = command.schema.safeParse(payload);
            if (!result.success) {
              socket.emit("error", { code: "INVALID_PAYLOAD", event: eventName, message: "Invalid payload." });
              return;
            }
            input = result.data;
          }

          // 3. Execute.
          try {
            await command.execute(socket, authId, input);
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
