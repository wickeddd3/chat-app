export class HttpException extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details: unknown = null,
  ) {
    super(message);
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
