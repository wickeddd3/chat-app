import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import type { ConnectionRequest } from "@/modules/connection/connections.types";
import { BroadcasterService } from "@/services/broadcaster.service";

@injectable()
export class RequestSubscriber {
  constructor(@inject(TYPES.BroadcasterService) private broadcaster: BroadcasterService) {
    this.handleRequestSent = this.handleRequestSent.bind(this);
    this.handleRequestAccepted = this.handleRequestAccepted.bind(this);
    this.handleRequestCanceled = this.handleRequestCanceled.bind(this);
    this.handleRequestDeclined = this.handleRequestDeclined.bind(this);
    this.handleContactRemoved = this.handleContactRemoved.bind(this);
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

  public handleRequestAccepted = async ({
    senderId,
    connection,
  }: {
    senderId: string;
    connection: ConnectionRequest;
  }): Promise<void> => {
    await this.broadcaster.emitToUser(senderId, "request:accepted", connection);
  };

  public handleRequestCanceled = async ({
    receiverId,
    senderId,
    connectionId,
  }: {
    receiverId: string;
    senderId: string;
    connectionId: string;
  }): Promise<void> => {
    await this.broadcaster.emitToUser(receiverId, "request:canceled", { senderId, connectionId });
  };

  public handleRequestDeclined = async ({
    senderId,
    receiverId,
    connectionId,
  }: {
    senderId: string;
    receiverId: string;
    connectionId: string;
  }): Promise<void> => {
    await this.broadcaster.emitToUser(senderId, "request:declined", { receiverId, connectionId });
  };

  /**
   * Only the *other* party is notified — the remover already applied the change
   * optimistically from their own mutation.
   */
  public handleContactRemoved = async ({
    authUserId,
    contactUserId,
    connectionId,
  }: {
    authUserId: string;
    contactUserId: string;
    connectionId: string;
  }): Promise<void> => {
    await this.broadcaster.emitToUser(contactUserId, "contact:removed", { userId: authUserId, connectionId });
  };
}
