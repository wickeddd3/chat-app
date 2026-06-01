import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import { ConnectionsService } from "./connections.service";
import { type NextFunction, type Response, Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class ConnectionsController extends BaseController implements Controller {
  public path = "/connections";
  public router = Router();

  constructor(@inject(TYPES.ConnectionsService) private connectionsService: ConnectionsService) {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/contacts`, [authMiddleware], this.getUserContacts);
    this.router.get(`${this.path}/sent`, [authMiddleware], this.getSentConnections);
    this.router.get(`${this.path}/received`, [authMiddleware], this.getReceivedConnections);
    this.router.post(`${this.path}/request`, [authMiddleware], this.sendRequest);
    this.router.post(`${this.path}/request/:id/accept`, [authMiddleware], this.acceptRequest);
    this.router.post(`${this.path}/request/:id/decline`, [authMiddleware], this.declineRequest);
    this.router.post(`${this.path}/request/:id/cancel`, [authMiddleware], this.cancelRequest);
  }

  private getUserContacts = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const limit = 20;
      const cursor = (req.query["cursor"] as string) || "";
      const query = (req.query["query"] as string) || "";

      const { contacts, nextCursor, hasMore } = await this.connectionsService.getUserContacts({
        authUserId: userId,
        limit,
        cursor,
        query,
      });

      this.sendSuccess(res, contacts, "Contacts fetched successfully", 200, {
        limit,
        nextCursor,
        hasMore,
      });
    } catch (error: any) {
      next(error);
    }
  };

  private getSentConnections = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const limit = 20;
      const cursor = (req.query?.cursor as string) || "";

      const { connections, nextCursor, hasMore } = await this.connectionsService.getSentConnections({
        authUserId: userId,
        limit,
        cursor,
        status: "PENDING",
      });

      this.sendSuccess(res, connections, "Sent connection requests fetched successfully", 200, {
        limit,
        nextCursor,
        hasMore,
      });
    } catch (error: any) {
      next(error);
    }
  };

  private getReceivedConnections = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const limit = 20;
      const cursor = (req.query?.cursor as string) || "";
      const { connections, nextCursor, hasMore } = await this.connectionsService.getReceivedConnections({
        authUserId: userId,
        limit,
        cursor,
        status: "PENDING",
      });

      this.sendSuccess(res, connections, "Received connection requests fetched successfully", 200, {
        limit,
        nextCursor,
        hasMore,
      });
    } catch (error: any) {
      next(error);
    }
  };

  private sendRequest = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const senderId = userId;
      const receiverId = req.body.receiverId;

      const request = await this.connectionsService.sendRequest(senderId, receiverId);

      this.sendSuccess(res, request, "Connection request sent successfully");
    } catch (error: any) {
      next(error);
    }
  };

  private acceptRequest = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const receiverId = userId;
      const connectionId = (req.params?.id as string) || "";

      const request = await this.connectionsService.acceptRequest(receiverId, connectionId);

      this.sendSuccess(res, request, "Connection request accepted successfully");
    } catch (error: any) {
      next(error);
    }
  };

  private declineRequest = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const receiverId = userId;
      const connectionId = (req.params?.id as string) || "";

      const request = await this.connectionsService.declineRequest(receiverId, connectionId);

      this.sendSuccess(res, request, "Connection request declined successfully");
    } catch (error: any) {
      next(error);
    }
  };

  private cancelRequest = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const senderId = userId;
      const connectionId = (req.params?.id as string) || "";

      const request = await this.connectionsService.cancelRequest(senderId, connectionId);

      this.sendSuccess(res, request, "Connection request canceled successfully");
    } catch (error: any) {
      next(error);
    }
  };
}
