import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { StatsController } from "./stats.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class StatsRouter implements HttpRouter {
  public path = "/stats";
  public router = Router();

  constructor(@inject(TYPES.StatsController) private statsController: StatsController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/badge`, [authMiddleware], this.statsController.getStats);
  }
}
