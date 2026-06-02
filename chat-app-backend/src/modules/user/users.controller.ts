import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import { UsersService } from "./users.service";
import { type NextFunction, type Response, Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { NotFoundException } from "@/utils/http.exception";

@injectable()
export class UsersController extends BaseController implements Controller {
  public path = "/users";
  public router = Router();

  constructor(@inject(TYPES.UsersService) private usersService: UsersService) {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, [authMiddleware], this.getSuggestedUsers);
    this.router.get(`${this.path}/profile/:username`, [authMiddleware], this.getUserByUsername);
  }

  private getSuggestedUsers = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.user?.id || "";
      const limit = 20;
      const query = (req.query.query as string) || "";
      const responseData = await this.usersService.getSuggestedUsers({ authUserId, limit, query });

      this.sendSuccess(res, responseData, "Suggested users fetched successfully");
    } catch (error: any) {
      // Directly triggers errorMiddleware instantly
      next(error);
    }
  };

  private getUserByUsername = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const username = req.params.username as string;
      const user = await this.usersService.getUserByUsername(username);

      if (!user) {
        throw new NotFoundException(`User profile '@${username}' could not be found`);
      }

      this.sendSuccess(res, user, "User profile retrieved successfully");
    } catch (error: any) {
      next(error);
    }
  };
}
