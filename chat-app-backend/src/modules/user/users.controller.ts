import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { UsersService } from "./users.service";
import type { Request, Response, NextFunction } from "express";
import { NotFoundException } from "@/utils/http.exception";

@injectable()
export class UsersController extends BaseController {
  constructor(@inject(TYPES.UsersService) private usersService: UsersService) {
    super();
  }

  public getSuggestedUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const limit = 20;
      const query = (req.query.query as string) || "";
      const responseData = await this.usersService.getSuggestedUsers({ authUserId, limit, query });

      this.sendSuccess(res, responseData, "Suggested users fetched successfully");
    } catch (error: unknown) {
      // Directly triggers errorMiddleware instantly
      next(error);
    }
  };

  public getUserByUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const username = req.params.username as string;
      const user = await this.usersService.getUserByUsername(username);

      if (!user) {
        throw new NotFoundException(`User profile '@${username}' could not be found`);
      }

      this.sendSuccess(res, user, "User profile retrieved successfully");
    } catch (error: unknown) {
      next(error);
    }
  };
}
