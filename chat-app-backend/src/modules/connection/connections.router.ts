import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { ConnectionsController } from "./connections.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/request.middleware";
import {
  connectionIdParamsSchema,
  connectionRequestBodySchema,
  connectionsListQuerySchema,
  contactUserIdParamsSchema,
} from "./connections.schema";

@injectable()
export class ConnectionsRouter implements HttpRouter {
  public path = "/connections";
  public router = Router();

  constructor(@inject(TYPES.ConnectionsController) private connectionsController: ConnectionsController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${this.path}/contacts`,
      [authMiddleware, validate({ query: connectionsListQuerySchema })],
      this.connectionsController.getUserContacts,
    );

    this.router.get(
      `${this.path}/sent`,
      [authMiddleware, validate({ query: connectionsListQuerySchema })],
      this.connectionsController.getSentConnections,
    );

    this.router.get(
      `${this.path}/received`,
      [authMiddleware, validate({ query: connectionsListQuerySchema })],
      this.connectionsController.getReceivedConnections,
    );

    this.router.delete(
      `${this.path}/contacts/:userId`,
      [authMiddleware, validate({ params: contactUserIdParamsSchema })],
      this.connectionsController.removeContact,
    );

    this.router.post(
      `${this.path}/request`,
      [authMiddleware, validate({ body: connectionRequestBodySchema })],
      this.connectionsController.sendRequest,
    );

    this.router.post(
      `${this.path}/request/:id/accept`,
      [authMiddleware, validate({ params: connectionIdParamsSchema })],
      this.connectionsController.acceptRequest,
    );

    this.router.post(
      `${this.path}/request/:id/decline`,
      [authMiddleware, validate({ params: connectionIdParamsSchema })],
      this.connectionsController.declineRequest,
    );

    this.router.post(
      `${this.path}/request/:id/cancel`,
      [authMiddleware, validate({ params: connectionIdParamsSchema })],
      this.connectionsController.cancelRequest,
    );
  }
}
