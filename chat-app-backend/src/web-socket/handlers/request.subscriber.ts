import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { ConnectionRequest } from "@/modules/connection/connections.types";
import { WebSocketBroadcaster } from "../web-socket.broadcaster";

@injectable()
export class RequestSubscriber {
  constructor(@inject(TYPES.WebSocketBroadcaster) private broadcaster: WebSocketBroadcaster) {
    this.handleRequestSent = this.handleRequestSent.bind(this);
  }

  public handleRequestSent = async ({
    receiverId,
    connection,
  }: {
    receiverId: string;
    connection: ConnectionRequest;
  }): Promise<void> => {
    await this.broadcaster.emitToUser(receiverId, "new_request", connection);
  };
}
