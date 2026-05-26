import { ConnectionStatus } from "@/prisma/client";
import { ConnectionsRepository } from "./connections.repository";
import type { PaginatedConnections } from "./connections.types";

export class ConnectionsService {
  private connectionsRepository = new ConnectionsRepository();

  public async getUserContacts(userId: string) {
    try {
      return await this.connectionsRepository.getUserContacts(userId);
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

  public async sendConnectionRequest(senderId: string, receiverId: string) {
    try {
      return await this.connectionsRepository.sendConnectionRequest(senderId, receiverId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to send connection request");
    }
  }

  public async acceptConnectionRequest(receiverId: string, connectionId: string) {
    try {
      return await this.connectionsRepository.acceptConnectionRequest(receiverId, connectionId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to accept connection request");
    }
  }
}
