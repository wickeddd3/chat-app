import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { ConnectionsService } from "./connections.service";
import type { Request, Response } from "express";

@injectable()
export class ConnectionsController extends BaseController {
  constructor(@inject(TYPES.ConnectionsService) private connectionsService: ConnectionsService) {
    super();
  }

  public getUserContacts = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const limit = 20;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";
    const query = typeof req.query.query === "string" ? req.query.query : "";

    const { contacts, nextCursor, hasMore, total } = await this.connectionsService.getUserContacts({
      authUserId,
      limit,
      cursor,
      query,
    });

    this.sendSuccess(res, contacts, "Contacts fetched successfully", 200, {
      limit,
      nextCursor,
      hasMore,
      total,
    });
  };

  public getSentConnections = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const limit = 20;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";

    const { connections, nextCursor, hasMore, total } = await this.connectionsService.getSentConnections({
      authUserId,
      limit,
      cursor,
      status: "PENDING",
    });

    this.sendSuccess(res, connections, "Sent connection requests fetched successfully", 200, {
      limit,
      nextCursor,
      hasMore,
      total,
    });
  };

  public getReceivedConnections = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const limit = 20;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";
    const { connections, nextCursor, hasMore, total } = await this.connectionsService.getReceivedConnections({
      authUserId,
      limit,
      cursor,
      status: "PENDING",
    });

    this.sendSuccess(res, connections, "Received connection requests fetched successfully", 200, {
      limit,
      nextCursor,
      hasMore,
      total,
    });
  };

  public sendRequest = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const body = req.body as { receiverId?: unknown };
    const receiverId = typeof body.receiverId === "string" ? body.receiverId : "";

    const request = await this.connectionsService.sendRequest(authUserId, receiverId);

    this.sendSuccess(res, request.sentConnection, "Connection request sent successfully");
  };

  public acceptRequest = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const connectionId = typeof req.params.id === "string" ? req.params.id : "";

    const request = await this.connectionsService.acceptRequest(authUserId, connectionId);

    this.sendSuccess(res, request.receivedConnection, "Connection request accepted successfully");
  };

  public declineRequest = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const connectionId = typeof req.params.id === "string" ? req.params.id : "";

    const request = await this.connectionsService.declineRequest(authUserId, connectionId);

    this.sendSuccess(res, request, "Connection request declined successfully");
  };

  public cancelRequest = async (req: Request, res: Response): Promise<void> => {
    const authUserId = req.authId ?? "";
    const connectionId = typeof req.params.id === "string" ? req.params.id : "";

    const request = await this.connectionsService.cancelRequest(authUserId, connectionId);

    this.sendSuccess(res, request, "Connection request canceled successfully");
  };
}
