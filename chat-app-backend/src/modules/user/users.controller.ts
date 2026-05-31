import { Controller, ControllerRequest } from "@/interfaces/controller.interface";
import HttpException from "@/utils/http.exception";
import { type NextFunction, type Request, type Response, Router } from "express";
import { UsersService } from "./users.service";
import { authMiddleware } from "@/middlewares/auth.middleware";

export class UsersController implements Controller {
  public path = "/users";
  public router = Router();
  private usersService = new UsersService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}`, [authMiddleware], this.getSuggestedUsers);
    this.router.get(`${this.path}/profile/:username`, [authMiddleware], this.getUserByUsername);
  }

  private getSuggestedUsers = async (req: ControllerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.user?.id || "";
      const limit = 20;
      const query = (req.query["query"] as string) || "";
      const responseData = await this.usersService.getSuggestedUsers({ authUserId, limit, query });

      res.status(200).json(responseData);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve users"));
    }
  };

  private getUserByUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const username = req.params.username as string;
      const user = await this.usersService.getUserByUsername(username);

      if (!user) return next(new HttpException(404, "User not found"));

      res.status(200).json(user);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve user"));
    }
  };
}
