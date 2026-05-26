import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import { type NextFunction, type Response, Router } from "express";
import { ConnectionsService } from "./connections.service";
import { authMiddleware } from "@/middlewares/auth.middleware";
import HttpException from "@/utils/http.exception";

export class ConnectionsController implements Controller {
  public path = "/connections";
  public router = Router();
  private connectionsService = new ConnectionsService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/contacts`, [authMiddleware], this.getUserContacts);
    this.router.get(`${this.path}/sent`, [authMiddleware], this.getSentConnections);
    this.router.get(`${this.path}/received`, [authMiddleware], this.getReceivedConnections);
    this.router.post(`${this.path}/request`, [authMiddleware], this.sendConnectionRequest);
    this.router.post(`${this.path}/request/:id/accept`, [authMiddleware], this.acceptConnectionRequest);
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

  private sendConnectionRequest = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const senderId = userId;
      const receiverId = req.body.receiverId;
      const contacts = await this.connectionsService.sendConnectionRequest(senderId, receiverId);

      res.status(200).json(contacts);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to send connection request"));
    }
  };

  private acceptConnectionRequest = async (
    req: ControllerRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id || "";
      const receiverId = userId;
      const connectionId = (req.params?.id as string) || "";
      const contacts = await this.connectionsService.acceptConnectionRequest(receiverId, connectionId);

      res.status(200).json(contacts);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to accept connection request"));
    }
  };
}
