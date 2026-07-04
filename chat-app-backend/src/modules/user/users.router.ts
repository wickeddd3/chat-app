import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { UsersController } from "./users.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/request.middleware";
import { suggestedUsersQuerySchema, usernameParamsSchema } from "./users.schema";

@injectable()
export class UsersRouter implements HttpRouter {
  public path = "/users";
  public router = Router();

  constructor(@inject(TYPES.UsersController) private usersController: UsersController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      this.path,
      [authMiddleware, validate({ query: suggestedUsersQuerySchema })],
      this.usersController.getSuggestedUsers,
    );

    this.router.get(
      `${this.path}/profile/:username`,
      [authMiddleware, validate({ params: usernameParamsSchema })],
      this.usersController.getUserByUsername,
    );
  }
}
