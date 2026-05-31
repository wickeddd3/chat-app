import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { ConnectionsService } from "./connections.service";
import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import HttpException from "@/utils/http.exception";
import { type NextFunction, type Response, Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class ConnectionsController implements Controller {
  public path = "/connections";
  public router = Router();

  constructor(@inject(TYPES.ConnectionsService) private connectionsService: ConnectionsService) {
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
      const contacts = await this.connectionsService.getUserContacts({ authUserId: userId, limit, cursor, query });

      res.status(200).json(contacts);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve connection contacts"));
    }
  };

  private getSentConnections = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const limit = 20;
      const cursor = (req.query?.cursor as string) || "";
      const sentConnections = await this.connectionsService.getSentConnections({
        authUserId: userId,
        limit,
        cursor,
        status: "PENDING",
      });

      res.status(200).json(sentConnections);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve sent connection requests"));
    }
  };

  private getReceivedConnections = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const limit = 20;
      const cursor = (req.query?.cursor as string) || "";
      const receivedConnections = await this.connectionsService.getReceivedConnections({
        authUserId: userId,
        limit,
        cursor,
        status: "PENDING",
      });

      res.status(200).json(receivedConnections);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve received connection requests"));
    }
  };

  private sendRequest = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const senderId = userId;
      const receiverId = req.body.receiverId;
      const request = await this.connectionsService.sendRequest(senderId, receiverId);

      res.status(200).json(request.connection);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to send connection request"));
    }
  };

  private acceptRequest = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const receiverId = userId;
      const connectionId = (req.params?.id as string) || "";
      const request = await this.connectionsService.acceptRequest(receiverId, connectionId);

      res.status(200).json(request.connection);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to accept connection request"));
    }
  };

  private declineRequest = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const receiverId = userId;
      const connectionId = (req.params?.id as string) || "";
      const request = await this.connectionsService.declineRequest(receiverId, connectionId);

      res.status(200).json(request);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to decline connection request"));
    }
  };

  private cancelRequest = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const senderId = userId;
      const connectionId = (req.params?.id as string) || "";
      const request = await this.connectionsService.cancelRequest(senderId, connectionId);

      res.status(200).json(request);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to cancel connection request"));
    }
  };
}
