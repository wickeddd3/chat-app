import type { Response } from "express";
import { ApiResponse } from "@/interfaces/api-response.interface";
import { injectable } from "inversify";

@injectable()
export abstract class BaseController {
  /**
   * Standardized 200 OK / 201 Created Success Wrapper
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message = "Operation completed successfully",
    statusCode = 200,
    meta?: ApiResponse["meta"],
  ): void {
    const responseBody: ApiResponse<T> = {
      success: true,
      message,
      data,
      ...(meta && { meta }),
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
