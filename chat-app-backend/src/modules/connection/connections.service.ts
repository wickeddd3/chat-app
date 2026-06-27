import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { ConnectionsRepository } from "./connections.repository";
import type { ConnectionStatus } from "@/prisma/client";
import type { ConnectionRequestResponse, PaginatedConnections, PaginatedContacts } from "./connections.types";
import { HttpException } from "@/utils/http.exception";
import { EventEmitter } from "events";
import { PresenceService } from "@/services/presence.service";

@injectable()
export class ConnectionsService {
  constructor(
    @inject(TYPES.ConnectionsRepository) private connectionsRepository: ConnectionsRepository,
    @inject(TYPES.EventDispatcher) private dispatcher: EventEmitter,
    @inject(TYPES.PresenceService) private presenceService: PresenceService,
  ) {}

  public async getUserContacts({
    authUserId,
    limit = 20,
    cursor = "",
    query = "",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    query?: string;
  }): Promise<PaginatedContacts> {
    try {
      return await this.connectionsRepository.getUserContacts({ authUserId, limit, cursor, query });
    } catch {
      throw new HttpException(500, "Failed to retrieve connection contacts.");
    }
  }

  public async getSentConnections({
    authUserId,
    limit = 20,
    cursor = "",
    status = "PENDING",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    status?: ConnectionStatus;
  }): Promise<PaginatedConnections> {
    try {
      return await this.connectionsRepository.getSentConnections({ authUserId, limit, cursor, status });
    } catch {
      throw new HttpException(500, "Failed to retrieve sent connection requests.");
    }
  }

  public async getReceivedConnections({
    authUserId,
    limit = 20,
    cursor = "",
    status = "PENDING",
  }: {
    authUserId: string;
    limit?: number;
    cursor?: string;
    status?: ConnectionStatus;
  }): Promise<PaginatedConnections> {
    try {
      return await this.connectionsRepository.getReceivedConnections({ authUserId, limit, cursor, status });
    } catch {
      throw new HttpException(500, "Failed to retrieve received connection requests.");
    }
  }

  public async sendRequest(senderId: string, receiverId: string): Promise<ConnectionRequestResponse> {
    try {
      const result = await this.connectionsRepository.sendRequest(senderId, receiverId);

      this.dispatcher.emit("notification:new", result.notification);
      this.dispatcher.emit("request:new", { receiverId, connection: result.receivedConnection });

      return result;
    } catch {
      throw new HttpException(500, "Failed to send connection request.");
    }
  }

  public async acceptRequest(receiverId: string, connectionId: string): Promise<ConnectionRequestResponse> {
    try {
      const result = await this.connectionsRepository.acceptRequest(receiverId, connectionId);

      // Extract the two user IDs involved in the connection
      const senderId = result.notification.userId; // The original requester
      this.presenceService.setPresenceLookup(senderId, receiverId);

      // Dispatch system notification event
      this.dispatcher.emit("notification:new", result.notification);

      return result;
    } catch {
      throw new HttpException(500, "Failed to accept connection request.");
    }
  }

  public async declineRequest(receiverId: string, connectionId: string): Promise<string> {
    try {
      const senderId = await this.connectionsRepository.declineRequest(receiverId, connectionId);

      this.dispatcher.emit("request:declined", { senderId, connectionId });

      return connectionId;
    } catch {
      throw new HttpException(500, "Failed to decline connection request.");
    }
  }

  public async cancelRequest(senderId: string, connectionId: string): Promise<string> {
    try {
      const receiverId = await this.connectionsRepository.cancelRequest(senderId, connectionId);

      this.dispatcher.emit("request:canceled", { receiverId, connectionId });

      return connectionId;
    } catch {
      throw new HttpException(500, "Failed to cancel connection request.");
    }
  }
}
