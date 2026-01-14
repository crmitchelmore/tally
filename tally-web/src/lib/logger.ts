/**
 * Tally Structured Logger
 *
 * Provides wide-event / canonical log lines that include correlation IDs,
 * structured context, and integrate with OpenTelemetry spans for distributed tracing.
 *
 * Philosophy: One log line per request/operation with all relevant context attached.
 */

import * as Sentry from "@sentry/nextjs";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  // Correlation
  traceId?: string;
  spanId?: string;
  requestId?: string;

  // User context (privacy: use hashed IDs only)
  userId?: string;

  // Operation context
  operation?: string;
  duration_ms?: number;

  // Error context
  error?: Error;
  errorMessage?: string;

  // Custom attributes
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  platform: "web" | "ios" | "android";
  environment: string;
  version: string;
  context: LogContext;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Structured logger with wide-event support
 *
 * Usage:
 * ```
 * import { logger } from '@/lib/logger';
 *
 * // Simple log
 * logger.info('User signed in', { userId: 'u_abc123' });
 *
 * // Wide event (canonical log line)
 * logger.info('api.request.completed', {
 *   operation: 'createChallenge',
 *   duration_ms: 150,
 *   userId: 'u_abc123',
 *   statusCode: 200,
 * });
 *
 * // Error with context
 * logger.error('Failed to create entry', {
 *   error: err,
 *   userId: 'u_abc123',
 *   challengeId: 'ch_xyz',
 * });
 * ```
 */
class TallyLogger {
  private service = "tally-web";
  private platform: "web" | "ios" | "android" = "web";
  private environment = process.env.NODE_ENV || "development";
  private version = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
  private minLevel: LogLevel =
    process.env.NODE_ENV === "production" ? "info" : "debug";

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Create a child logger with preset context
   */
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * Debug level log
   */
  debug(message: string, context: LogContext = {}): void {
    this.log("debug", message, context);
  }

  /**
   * Info level log
   */
  info(message: string, context: LogContext = {}): void {
    this.log("info", message, context);
  }

  /**
   * Warning level log
   */
  warn(message: string, context: LogContext = {}): void {
    this.log("warn", message, context);
  }

  /**
   * Error level log - also reports to Sentry
   */
  error(message: string, context: LogContext = {}): void {
    this.log("error", message, context);

    // Report to Sentry for error level
    if (context.error) {
      Sentry.withScope((scope) => {
        // Add context as extras
        const { error, ...extras } = context;
        Object.entries(extras).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });

        // Add breadcrumb
        scope.addBreadcrumb({
          category: "log",
          message,
          level: "error",
        });

        Sentry.captureException(error);
      });
    } else {
      // Report message-only errors
      Sentry.captureMessage(message, {
        level: "error",
        extra: context,
      });
    }
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, message: string, context: LogContext): void {
    // Check log level
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      platform: this.platform,
      environment: this.environment,
      version: this.version,
      context: this.sanitizeContext(context),
    };

    // Format as JSON for structured logging
    const output = JSON.stringify(entry);

    // Output based on level
    switch (level) {
      case "debug":
        console.debug(output);
        break;
      case "info":
        console.info(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "error":
        console.error(output);
        break;
    }

    // Add as Sentry breadcrumb for non-error logs
    if (level !== "error") {
      Sentry.addBreadcrumb({
        category: "log",
        message,
        level: level === "warn" ? "warning" : level,
        data: context,
      });
    }
  }

  /**
   * Sanitize context to ensure no PII leaks
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };

    // Extract error message if Error object present
    if (sanitized.error instanceof Error) {
      sanitized.errorMessage = sanitized.error.message;
      sanitized.errorStack =
        process.env.NODE_ENV === "development"
          ? sanitized.error.stack
          : undefined;
      delete sanitized.error;
    }

    // Remove any fields that might contain PII
    const piiFields = ["email", "password", "token", "secret", "apiKey"];
    piiFields.forEach((field) => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    return sanitized;
  }
}

/**
 * Child logger with preset context
 */
class ChildLogger {
  constructor(
    private parent: TallyLogger,
    private baseContext: LogContext
  ) {}

  debug(message: string, context: LogContext = {}): void {
    this.parent.debug(message, { ...this.baseContext, ...context });
  }

  info(message: string, context: LogContext = {}): void {
    this.parent.info(message, { ...this.baseContext, ...context });
  }

  warn(message: string, context: LogContext = {}): void {
    this.parent.warn(message, { ...this.baseContext, ...context });
  }

  error(message: string, context: LogContext = {}): void {
    this.parent.error(message, { ...this.baseContext, ...context });
  }
}

// Export singleton
export const logger = new TallyLogger();

// Export types
export type { LogEntry, ChildLogger };
