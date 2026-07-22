import pino, { type Logger } from "pino";
import { IS_PRODUCTION, IS_TEST, LOG_LEVEL } from "@/config/app.config";

/**
 * Root application logger.
 *
 * - Development: human-friendly, colorized output via `pino-pretty` (a
 *   devDependency, so it is never loaded in production).
 * - Production: newline-delimited JSON on stdout, ready to be shipped to a log
 *   aggregator (CloudWatch, Loki, Datadog, ...).
 *
 * Sensitive fields are redacted so tokens/credentials never reach the logs.
 */
export const logger: Logger = pino({
  level: LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
  ...(IS_PRODUCTION || IS_TEST
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            // Hide the noisy per-request blobs so HTTP logs render as the single
            // line built by pino-http's customSuccessMessage/customErrorMessage.
            // (They remain in the structured JSON emitted in production.)
            ignore: "pid,hostname,req,res,responseTime",
          },
        },
      }),
});

/**
 * Create a child logger tagged with a `context` (module/component name) so log
 * lines are easy to filter, e.g. `createLogger("Redis")`.
 */
export function createLogger(context: string): Logger {
  return logger.child({ context });
}
