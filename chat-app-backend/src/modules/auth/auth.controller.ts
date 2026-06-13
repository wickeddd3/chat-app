import { injectable, inject } from "inversify";
import { TYPES } from "@/config/types";
import { BaseController } from "@/utils/base.controller";
import { AuthService } from "./auth.service";
import type { ProfileSchemaType, SignUpSchemaType } from "./auth.schema";
import type { Request, Response, NextFunction } from "express";
import { NotFoundException } from "@/utils/http.exception";

@injectable()
export class AuthController extends BaseController {
  constructor(@inject(TYPES.AuthService) private authService: AuthService) {
    super();
  }

  public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as SignUpSchemaType;
      const responseData = await this.authService.createUser(data);

      this.sendSuccess(res, responseData, "User created successfully.");
    } catch (error: unknown) {
      next(error);
    }
  };

  public getAuthUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

  public updateUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const data = req.body as ProfileSchemaType;
      const user = await this.authService.updateUserProfile(authUserId, data);

      this.sendSuccess(res, user, "User profile updated successfully.");
    } catch (error: unknown) {
      next(error);
    }
  };

  public updateUserImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUserId = req.authId ?? "";
      const data = req.body as { image: string };
      const user = await this.authService.updateUserImage(authUserId, data);

      this.sendSuccess(res, user, "User image updated successfully.");
    } catch (error: unknown) {
      next(error);
    }
  };
}
