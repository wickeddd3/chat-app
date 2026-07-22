import { injectable, inject } from "inversify";
import { EventEmitter } from "events";
import { TYPES } from "@/config/types";
import type { ConnectionStatus } from "@/prisma/client";
import { PresenceService } from "@/services/presence.service";
import { createLogger } from "@/lib/logger";
import { NotificationsRepository } from "@/modules/notification/persistence/notifications.repository";
import { TransactionManager } from "@/shared/persistence/transaction";
import { ConnectionsQuery } from "./persistence/connections.query";
import { ConnectionsRepository } from "./persistence/connections.repository";
import { connectionAcceptedNotification, connectionRequestNotification } from "./connections.notifications";
import { toConnectionRequest } from "./connections.mapper";
import {
  assertCanAccept,
  assertCanCancel,
  assertCanDecline,
  assertNoExistingConnection,
  assertNotSelfConnection,
} from "./connections.policy";
import type { ConnectionRequestResponse, PaginatedConnections, PaginatedContacts } from "./connections.types";

const log = createLogger("Connections");

/**
 * Orchestrates connection requests: enforce policy, persist atomically, then
 * announce.
 *
 * Failures propagate as-is — the domain errors thrown by the policy and the
 * repositories already carry their meaning, and `errorMiddleware` maps them to a
 * status. Catching here only to re-throw a 500 (the previous convention) is what
 * turned every authorization failure into an opaque server error.
 */
@injectable()
export class ConnectionsService {
  constructor(
    @inject(TYPES.ConnectionsQuery) private connectionsQuery: ConnectionsQuery,
    @inject(TYPES.ConnectionsRepository) private connectionsRepository: ConnectionsRepository,
    @inject(TYPES.NotificationsRepository) private notificationsRepository: NotificationsRepository,
    @inject(TYPES.TransactionManager) private transaction: TransactionManager,
    @inject(TYPES.EventDispatcher) private dispatcher: EventEmitter,
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
  ) {}

  public async getUserContacts(params: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    query?: string;
  }): Promise<PaginatedContacts> {
    return this.connectionsQuery.getUserContacts(params);
  }

  public async getSentConnections(params: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    status?: ConnectionStatus;
  }): Promise<PaginatedConnections> {
    return this.connectionsQuery.getSentConnections(params);
  }

  public async getReceivedConnections(params: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    status?: ConnectionStatus;
  }): Promise<PaginatedConnections> {
    return this.connectionsQuery.getReceivedConnections(params);
  }

  public async sendRequest(senderId: string, receiverId: string): Promise<ConnectionRequestResponse> {
    assertNotSelfConnection(senderId, receiverId);
    // Guards the reverse direction; the same-direction duplicate is additionally
    // caught by the (senderId, receiverId) unique index, which surfaces as a 409.
    assertNoExistingConnection(await this.connectionsRepository.findBetween(senderId, receiverId));

    const result = await this.transaction.run(async (tx) => {
      const connection = await this.connectionsRepository.create({ senderId, receiverId }, tx);
      const notification = await this.notificationsRepository.create(connectionRequestNotification(connection), tx);

      return {
        sentConnection: toConnectionRequest(connection, connection.receiver),
        receivedConnection: toConnectionRequest(connection, connection.sender),
        notification,
      };
    });

    this.dispatcher.emit("notification:new", result.notification);
    this.dispatcher.emit("request:new", { receiverId, connection: result.receivedConnection });

    return result;
  }

  public async acceptRequest(receiverId: string, connectionId: string): Promise<ConnectionRequestResponse> {
    const existing = await this.connectionsRepository.findById(connectionId);
    assertCanAccept(existing, receiverId);
    const senderId = existing.senderId;

    const result = await this.transaction.run(async (tx) => {
      const connection = await this.connectionsRepository.markAccepted(connectionId, tx);
      // The incoming request alert has been acted on — retire it.
      await this.notificationsRepository.markReadByReference({ referenceId: connectionId, userId: receiverId }, tx);
      const notification = await this.notificationsRepository.create(connectionAcceptedNotification(connection), tx);

      return {
        sentConnection: toConnectionRequest(connection, connection.receiver),
        receivedConnection: toConnectionRequest(connection, connection.sender),
        notification,
      };
    });

    // Fire-and-forget presence cache warming: a failure here must not fail the
    // (already-committed) accept, but shouldn't be silent either.
    this.presenceService.setPresenceLookup(senderId, receiverId).catch((error: unknown) => {
      log.error({ err: error, senderId, receiverId }, "Failed to warm presence cache");
    });

    this.dispatcher.emit("notification:new", result.notification);
    this.dispatcher.emit("request:accepted", { senderId, connection: result.sentConnection });

    return result;
  }

  /** DECLINE: run by the addressee of an incoming request. */
  public async declineRequest(receiverId: string, connectionId: string): Promise<string> {
    const existing = await this.connectionsRepository.findById(connectionId);
    assertCanDecline(existing, receiverId);
    const senderId = existing.senderId;

    await this.transaction.run(async (tx) => {
      await this.connectionsRepository.delete(connectionId, tx);
      // Drop the now-meaningless alert from the decliner's inbox.
      await this.notificationsRepository.deleteByReference(
        { referenceId: connectionId, userId: receiverId, type: "CONNECTION_REQUEST" },
        tx,
      );
    });

    this.dispatcher.emit("request:declined", { senderId, receiverId, connectionId });

    return connectionId;
  }

  /** CANCEL: run by the author of an outbound request. */
  public async cancelRequest(senderId: string, connectionId: string): Promise<string> {
    const existing = await this.connectionsRepository.findById(connectionId);
    assertCanCancel(existing, senderId);
    const receiverId = existing.receiverId;

    await this.transaction.run(async (tx) => {
      await this.connectionsRepository.delete(connectionId, tx);
      // Withdraw the request from the recipient's inbox so it disappears.
      await this.notificationsRepository.deleteByReference(
        { referenceId: connectionId, userId: receiverId, type: "CONNECTION_REQUEST" },
        tx,
      );
    });

    this.dispatcher.emit("request:canceled", { receiverId, senderId, connectionId });

    return connectionId;
  }
}
