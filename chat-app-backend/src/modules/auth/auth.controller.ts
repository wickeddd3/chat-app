import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { Controller } from "@/interfaces/controller.interface";
import { AuthService } from "./auth.service";
import { Router, type Request, type Response, type NextFunction } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { NotFoundException } from "@/utils/http.exception";

@injectable()
export class AuthController extends BaseController implements Controller {
  public path = "/auth";
  public router = Router();

  constructor(@inject(TYPES.AuthService) private authService: AuthService) {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, [authMiddleware], this.getAuthUser);
    this.router.post(`${this.path}/sign-up`, this.signUp);
    this.router.post(`${this.path}/profile`, [authMiddleware], this.updateUserProfile);
    this.router.post(`${this.path}/email`, [authMiddleware], this.updateUserEmail);
    this.router.post(`${this.path}/image`, [authMiddleware], this.updateUserImage);
    this.router.post(`${this.path}/password`, [authMiddleware], this.updateUserPassword);
  }

  private signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as { name: string; username: string; email: string; password: string };
      const responseData = await this.authService.createUser(data);

      this.sendSuccess(res, responseData, "User created successfully.");
    } catch (error: unknown) {
      next(error);
    }
  };

  private getAuthUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const user = await this.authService.getUserById(authUserId);

      if (!user) {
        throw new NotFoundException(`User profile not found.`);
      }

      this.sendSuccess(res, user, "User profile retrieved successfully");
    } catch (error: unknown) {
      next(error);
    }
  };

  private updateUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const data = req.body as { name: string; username: string };
      const user = await this.authService.updateUserProfile(authUserId, data);

      this.sendSuccess(res, user, "User profile updated successfully.");
    } catch (error: unknown) {
      next(error);
    }
  };

  private updateUserEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const data = req.body as { email: string };
      const user = await this.authService.updateUserEmail(authUserId, data);

      this.sendSuccess(res, user, "User email updated successfully.");
    } catch (error: unknown) {
      next(error);
    }
  };

  private updateUserImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const data = req.body as { image: string };
      const user = await this.authService.updateUserImage(authUserId, data);

      this.sendSuccess(res, user, "User image updated successfully.");
    } catch (error: unknown) {
      next(error);
    }
  };

  private updateUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as {
        newPassword: string;
        currentPassword: string;
      };
      const user = await this.authService.updateUserPassword(data);

      this.sendSuccess(res, user, "User password updated successfully.");
    } catch (error: unknown) {
      next(error);
    }
  };
}
