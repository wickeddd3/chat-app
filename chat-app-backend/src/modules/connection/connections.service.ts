import { ConnectionStatus } from "@/prisma/client";
import { ConnectionsRepository } from "./connections.repository";
import type { PaginatedConnections, PaginatedContacts } from "./connections.types";
import { eventDispatcher } from "@/lib/event-dispatcher";

export class ConnectionsService {
  private connectionsRepository = new ConnectionsRepository();

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
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve connection contacts");
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
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve sent connection requests");
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
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve received connection requests");
    }
  }

  public async sendRequest(senderId: string, receiverId: string) {
    try {
      const result = await this.connectionsRepository.sendRequest(senderId, receiverId);

      eventDispatcher.emit("notification:created", result.notification);

      return result;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to send connection request");
    }
  }

  public async acceptRequest(receiverId: string, connectionId: string) {
    try {
      const result = await this.connectionsRepository.acceptRequest(receiverId, connectionId);

      eventDispatcher.emit("notification:created", result.notification);

      return result;
    } catch (error: any) {
      throw new Error(error?.message || "Failed to accept connection request");
    }
  }

  public async declineRequest(receiverId: string, connectionId: string) {
    try {
      return await this.connectionsRepository.declineRequest(receiverId, connectionId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to decline connection request");
    }
  }

  public async cancelRequest(senderId: string, connectionId: string) {
    try {
      return await this.connectionsRepository.cancelRequest(senderId, connectionId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to cancel connection request");
    }
  }
}
