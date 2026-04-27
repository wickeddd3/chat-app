import type { Request, Router } from "express";
import type { User } from "@/prisma/client";

export interface Controller {
  path: string;
  router: Router;
}

export interface ControllerRequest extends Request {
  user?: User;
}
