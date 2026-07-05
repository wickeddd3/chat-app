import type { Socket } from "socket.io";
import type { ZodType } from "zod";

export interface WebSocketCommand<TPayload = unknown> {
  readonly eventName: string;

  /**
   * Optional zod schema for the inbound payload. When present, the dispatcher
   * validates `data` against it before calling `execute`, rejecting malformed
   * input at the boundary (mirrors the HTTP `validate` middleware).
   */
  readonly schema?: ZodType<TPayload>;

  execute(socket: Socket, authId: string, data: TPayload): Promise<void> | void;
}
