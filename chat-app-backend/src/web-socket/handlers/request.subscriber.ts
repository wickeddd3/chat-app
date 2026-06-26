import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { ConnectionRequest } from "@/modules/connection/connections.types";
import { WebSocketBroadcaster } from "../web-socket.broadcaster";

@injectable()
export class RequestSubscriber {
  constructor(@inject(TYPES.WebSocketBroadcaster) private broadcaster: WebSocketBroadcaster) {
    this.handleRequestSent = this.handleRequestSent.bind(this);
    this.handleRequestCanceled = this.handleRequestCanceled.bind(this);
    this.handleRequestDeclined = this.handleRequestDeclined.bind(this);
  }

  public handleRequestSent = async ({
    receiverId,
    connection,
  }: {
    receiverId: string;
    connection: ConnectionRequest;
  }): Promise<void> => {
    await this.broadcaster.emitToUser(receiverId, "request:new", connection);
  };

  public handleRequestCanceled = async ({
    receiverId,
    connectionId,
  }: {
    receiverId: string;
    connectionId: string;
  }): Promise<void> => {
    await this.broadcaster.emitToUser(receiverId, "request:cancel", connectionId);
  };

  public handleRequestDeclined = async ({
    senderId,
    connectionId,
  }: {
    senderId: string;
    connectionId: string;
  }): Promise<void> => {
    await this.broadcaster.emitToUser(senderId, "request:declined", connectionId);
  };
}
