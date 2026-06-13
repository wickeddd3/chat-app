import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { UsersController } from "./users.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

@injectable()
export class UsersRouter implements HttpRouter {
  public path = "/users";
  public router = Router();

  constructor(@inject(TYPES.UsersController) private usersController: UsersController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, [authMiddleware], this.usersController.getSuggestedUsers);

    this.router.get(`${this.path}/profile/:username`, [authMiddleware], this.usersController.getUserByUsername);
  }
}
