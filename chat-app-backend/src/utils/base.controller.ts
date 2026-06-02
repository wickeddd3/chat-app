import type { Response } from "express";
import { ApiResponse } from "@/interfaces/api-response.interface";
import { injectable } from "inversify";

@injectable()
export abstract class BaseController {
  /**
   * Standardized 200 OK / 201 Created Success Wrapper
   */
  protected sendSuccess(
    res: Response,
    data: unknown,
    message = "Operation completed successfully",
    statusCode = 200,
    meta?: ApiResponse["meta"],
  ): void {
    const responseBody: ApiResponse = {
      success: true,
      message,
      data,
      ...(meta !== undefined ? { meta } : {}),
      timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(responseBody);
  }

  /**
   * Standardized No Content / Delete Payload Wrapper
   */
  protected sendEmptySuccess(res: Response, message = "Resource updated successfully", statusCode = 200): void {
    const responseBody: ApiResponse = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(responseBody);
  }
}
