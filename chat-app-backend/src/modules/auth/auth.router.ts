import { inject, injectable } from "inversify";
import { Router } from "express";
import { TYPES } from "@/config/types";
import { HttpRouter } from "@/interfaces/router.interface";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/request.middleware";
import { ProfileSchema, SignUpSchema, UpdateImageSchema } from "./auth.schema";

@injectable()
export class AuthRouter implements HttpRouter {
  public path = "/auth";
  public router = Router();

  constructor(@inject(TYPES.AuthController) private authController: AuthController) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, [authMiddleware], this.authController.getAuthUser);

    this.router.post(`${this.path}/sign-up`, [validate({ body: SignUpSchema })], this.authController.signUp);

    this.router.post(
      `${this.path}/profile`,
      [authMiddleware, validate({ body: ProfileSchema })],
      this.authController.updateUserProfile,
    );

    this.router.post(
      `${this.path}/image`,
      [authMiddleware, validate({ body: UpdateImageSchema })],
      this.authController.updateUserImage,
    );
  }
}
