/**
 * Domain errors — the vocabulary the service and persistence layers throw in.
 *
 * Layers below the HTTP boundary describe *what went wrong in the domain*, never
 * an HTTP status: a repository has no business deciding that a missing row is a
 * 404. `errorMiddleware` owns the single domain → status mapping, so the same
 * error is reported correctly whether it surfaced over REST or a socket command.
 *
 * The previous convention (throw `HttpException(500)` at every layer, then catch
 * and re-wrap it one layer up) collapsed authorization and conflict failures into
 * opaque 500s with the real reason buried two `cause` levels deep.
 */
export abstract class DomainError extends Error {
  /** Stable machine-readable discriminator, mapped to a status at the boundary. */
  public abstract readonly code: string;
  public readonly details: unknown;

  constructor(message: string, details: unknown = null, options?: ErrorOptions) {
    // Forward ErrorOptions (notably `cause`) so the underlying error survives.
    super(message, options);
    this.name = new.target.name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
  }
}

/** The requested resource does not exist, or is not visible to this caller. */
export class NotFoundError extends DomainError {
  public readonly code = "NOT_FOUND";
}

/** The caller is authenticated but not allowed to perform this action. */
export class ForbiddenError extends DomainError {
  public readonly code = "FORBIDDEN";
}

/** The action conflicts with current state (duplicate, or a bad state transition). */
export class ConflictError extends DomainError {
  public readonly code = "CONFLICT";
}

/** The input is well-formed but violates a domain invariant. */
export class ValidationError extends DomainError {
  public readonly code = "VALIDATION";
}

/**
 * An infrastructure failure that the domain cannot interpret (dropped connection,
 * constraint we don't model, driver error). Always maps to 500 — the only error
 * class that does.
 */
export class PersistenceError extends DomainError {
  public readonly code = "PERSISTENCE";
}
