import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { HttpException } from "@/utils/http.exception";

interface ValidationSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

function toIssues(error: ZodError): { field: string; message: string }[] {
  // Flatten validation failures into a clean, readable dictionary array.
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Validate request input at the boundary against zod schemas.
 *
 * - `body` is parsed and reassigned, so controllers receive the cleaned value
 *   (unknown keys are stripped by zod's default object parsing).
 * - `params`/`query` are validated as a *gate* only: Express 5 exposes `query`
 *   via a re-parsing getter and owns `params`, so a parsed value cannot be
 *   written back. A valid request simply proceeds; a malformed one gets a 400.
 */
export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.params) {
        await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        await schemas.query.parseAsync(req.query);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new HttpException(400, "Validation Failed", toIssues(error)));
        return;
      }
      next(new HttpException(400, "Malformed request payload"));
    }
  };
};

/** Back-compat helper: validate the request body only. */
export const requestMiddleware = (schema: z.ZodType) => validate({ body: schema });
