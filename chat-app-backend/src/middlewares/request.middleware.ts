import type { Request, Response, NextFunction } from "express";
import { type ZodObject, ZodError } from "zod";
import { HttpException } from "@/utils/http.exception";

/**
 * Higher-order middleware to validate incoming request payloads against a structural schema
 */
export const requestMiddleware = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse and validate the incoming body
      // strip() removes any extra malicious/unwanted fields injected into the body
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Flatten validation failures into a clean, readable dictionary array
        const issues = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        next(new HttpException(400, "Validation Failed", issues));
        return;
      }

      next(new HttpException(400, "Malformed request body payload"));
    }
  };
};
