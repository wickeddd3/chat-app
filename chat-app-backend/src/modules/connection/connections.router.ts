import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { ConnectionsController } from "./connections.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class ConnectionsRouter implements HttpRouter {
  public path = "/connections";
  public router = Router();

  constructor(@inject(TYPES.ConnectionsController) private connectionsController: ConnectionsController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/contacts`, [authMiddleware], this.connectionsController.getUserContacts);

    this.router.get(`${this.path}/sent`, [authMiddleware], this.connectionsController.getSentConnections);

    this.router.get(`${this.path}/received`, [authMiddleware], this.connectionsController.getReceivedConnections);

    this.router.post(`${this.path}/request`, [authMiddleware], this.connectionsController.sendRequest);

    this.router.post(`${this.path}/request/:id/accept`, [authMiddleware], this.connectionsController.acceptRequest);

    this.router.post(`${this.path}/request/:id/decline`, [authMiddleware], this.connectionsController.declineRequest);

    this.router.post(`${this.path}/request/:id/cancel`, [authMiddleware], this.connectionsController.cancelRequest);
  }
}
