import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { PresenceController } from "./presence.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class PresenceRouter implements HttpRouter {
  public path = "/presence";
  public router = Router();

  constructor(@inject(TYPES.PresenceController) private presenceController: PresenceController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(`${this.path}/sync-snapshot`, [authMiddleware], this.presenceController.syncSnapshot);
  }
}
