import { ConnectionStatus } from "@/prisma/client";
import { ConnectionsRepository } from "./connections.repository";

export class ConnectionsService {
  private connectionsRepository = new ConnectionsRepository();

  public async getUserContacts(userId: string) {
    try {
      return await this.connectionsRepository.getUserContacts(userId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve connection contacts");
    }
  }

  public async getSentConnections(userId: string) {
    try {
      return await this.connectionsRepository.getSentConnections(userId);
    } catch (error: any) {
      throw new Error(error?.message || "Failed to retrieve sent connection requests");
    }
  }

  public async getReceivedConnections(userId: string, status?: ConnectionStatus) {
    try {
      return await this.connectionsRepository.getReceivedConnections(userId, status);
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
