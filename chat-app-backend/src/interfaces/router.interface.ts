import type { Router } from "express";

export interface HttpRouter {
  path: string;
  router: Router;
}
