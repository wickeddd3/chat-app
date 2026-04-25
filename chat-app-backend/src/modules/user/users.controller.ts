import { Controller } from "@/interfaces/controller.interface";
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
    this.router.get(`${this.path}`, [authMiddleware], this.getAllUsers);
  }

  private getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.usersService.getAllUsers();

      res.status(200).json(users);
    } catch (error: any) {
      next(new HttpException(500, error?.message || "Failed to retrieve users"));
    }
  };
}
