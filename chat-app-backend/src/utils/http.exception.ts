export class HttpException extends Error {
  public readonly statusCode: number;
  public readonly details: unknown;

  constructor(statusCode: number, message: string, details: unknown = null, options?: ErrorOptions) {
    // Forward ErrorOptions (notably `cause`) to Error so the underlying error is
    // preserved for logging instead of being swallowed at the throw site.
    super(message, options);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
  }
}

// Custom Helpers for common codes
export class NotFoundException extends HttpException {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = "Bad Request", details?: unknown) {
    super(400, message, details);
  }
}
