/**
 * Validation helpers for API routes
 */
import type { TimeframeType } from "./types";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate challenge creation request
 */
export function validateCreateChallenge(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "body", message: "Invalid request body" }] };
  }

  const body = data as Record<string, unknown>;

  // name
  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push({ field: "name", message: "Name is required" });
  } else if (body.name.length > 100) {
    errors.push({ field: "name", message: "Name must be 100 characters or less" });
  }

  // target
  if (body.target === undefined || body.target === null) {
    errors.push({ field: "target", message: "Target is required" });
  } else if (typeof body.target !== "number" || body.target < 1) {
    errors.push({ field: "target", message: "Target must be a positive number" });
  } else if (body.target > 1000000000) {
    errors.push({ field: "target", message: "Target is too large" });
  }

  // timeframeType
  const validTimeframes: TimeframeType[] = ["year", "month", "custom"];
  if (!body.timeframeType || !validTimeframes.includes(body.timeframeType as TimeframeType)) {
    errors.push({
      field: "timeframeType",
      message: "Timeframe type must be one of: year, month, custom",
    });
  }

  // For custom timeframe, validate dates
  if (body.timeframeType === "custom") {
    if (!body.startDate || !isValidDate(body.startDate as string)) {
      errors.push({ field: "startDate", message: "Valid start date is required for custom timeframe" });
    }
    if (!body.endDate || !isValidDate(body.endDate as string)) {
      errors.push({ field: "endDate", message: "Valid end date is required for custom timeframe" });
    }
    if (
      body.startDate &&
      body.endDate &&
      isValidDate(body.startDate as string) &&
      isValidDate(body.endDate as string)
    ) {
      if (new Date(body.startDate as string) > new Date(body.endDate as string)) {
        errors.push({ field: "endDate", message: "End date must be after start date" });
      }
    }
  }

  // Optional fields
  if (body.color !== undefined && typeof body.color !== "string") {
    errors.push({ field: "color", message: "Color must be a string" });
  }
  if (body.icon !== undefined && typeof body.icon !== "string") {
    errors.push({ field: "icon", message: "Icon must be a string" });
  }
  if (body.isPublic !== undefined && typeof body.isPublic !== "boolean") {
    errors.push({ field: "isPublic", message: "isPublic must be a boolean" });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate challenge update request
 */
export function validateUpdateChallenge(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "body", message: "Invalid request body" }] };
  }

  const body = data as Record<string, unknown>;

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      errors.push({ field: "name", message: "Name must be a non-empty string" });
    } else if (body.name.length > 100) {
      errors.push({ field: "name", message: "Name must be 100 characters or less" });
    }
  }

  if (body.target !== undefined) {
    if (typeof body.target !== "number" || body.target < 1) {
      errors.push({ field: "target", message: "Target must be a positive number" });
    } else if (body.target > 1000000000) {
      errors.push({ field: "target", message: "Target is too large" });
    }
  }

  if (body.color !== undefined && typeof body.color !== "string") {
    errors.push({ field: "color", message: "Color must be a string" });
  }
  if (body.icon !== undefined && typeof body.icon !== "string") {
    errors.push({ field: "icon", message: "Icon must be a string" });
  }
  if (body.isPublic !== undefined && typeof body.isPublic !== "boolean") {
    errors.push({ field: "isPublic", message: "isPublic must be a boolean" });
  }
  if (body.isArchived !== undefined && typeof body.isArchived !== "boolean") {
    errors.push({ field: "isArchived", message: "isArchived must be a boolean" });
  }
  if (body.countType !== undefined) {
    const validCountTypes = ["simple", "sets", "custom"];
    if (typeof body.countType !== "string" || !validCountTypes.includes(body.countType)) {
      errors.push({ field: "countType", message: "countType must be one of: simple, sets, custom" });
    }
  }
  if (body.unitLabel !== undefined && typeof body.unitLabel !== "string") {
    errors.push({ field: "unitLabel", message: "unitLabel must be a string" });
  }
  if (body.defaultIncrement !== undefined) {
    if (typeof body.defaultIncrement !== "number" || body.defaultIncrement < 1) {
      errors.push({ field: "defaultIncrement", message: "defaultIncrement must be a positive number" });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate entry creation request
 */
export function validateCreateEntry(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "body", message: "Invalid request body" }] };
  }

  const body = data as Record<string, unknown>;

  // challengeId
  if (!body.challengeId || typeof body.challengeId !== "string") {
    errors.push({ field: "challengeId", message: "Challenge ID is required" });
  }

  // date
  if (!body.date || !isValidDate(body.date as string)) {
    errors.push({ field: "date", message: "Valid date is required (YYYY-MM-DD)" });
  } else {
    // Check if date is in the future
    const today = new Date().toISOString().split("T")[0];
    if ((body.date as string) > today) {
      errors.push({ field: "date", message: "Cannot log entries for future dates" });
    }
  }

  // count
  if (body.count === undefined || body.count === null) {
    errors.push({ field: "count", message: "Count is required" });
  } else if (typeof body.count !== "number" || body.count < 1) {
    errors.push({ field: "count", message: "Count must be a positive number" });
  } else if (body.count > 1000000) {
    errors.push({ field: "count", message: "Count is too large" });
  }

  // Optional fields
  if (body.note !== undefined && typeof body.note !== "string") {
    errors.push({ field: "note", message: "Note must be a string" });
  }
  if (body.note !== undefined && (body.note as string).length > 500) {
    errors.push({ field: "note", message: "Note must be 500 characters or less" });
  }

  const validFeelings = ["great", "good", "okay", "tough"];
  if (body.feeling !== undefined && !validFeelings.includes(body.feeling as string)) {
    errors.push({
      field: "feeling",
      message: "Feeling must be one of: great, good, okay, tough",
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate entry update request
 */
export function validateUpdateEntry(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "body", message: "Invalid request body" }] };
  }

  const body = data as Record<string, unknown>;

  if (body.date !== undefined) {
    if (!isValidDate(body.date as string)) {
      errors.push({ field: "date", message: "Invalid date format (YYYY-MM-DD)" });
    } else {
      const today = new Date().toISOString().split("T")[0];
      if ((body.date as string) > today) {
        errors.push({ field: "date", message: "Cannot log entries for future dates" });
      }
    }
  }

  if (body.count !== undefined) {
    if (typeof body.count !== "number" || body.count < 1) {
      errors.push({ field: "count", message: "Count must be a positive number" });
    } else if (body.count > 1000000) {
      errors.push({ field: "count", message: "Count is too large" });
    }
  }

  if (body.note !== undefined && body.note !== null && typeof body.note !== "string") {
    errors.push({ field: "note", message: "Note must be a string" });
  }
  if (body.note !== undefined && body.note !== null && (body.note as string).length > 500) {
    errors.push({ field: "note", message: "Note must be 500 characters or less" });
  }

  const validFeelings = ["great", "good", "okay", "tough"];
  if (
    body.feeling !== undefined &&
    body.feeling !== null &&
    !validFeelings.includes(body.feeling as string)
  ) {
    errors.push({
      field: "feeling",
      message: "Feeling must be one of: great, good, okay, tough",
    });
  }

  // Validate sets if provided
  if (body.sets !== undefined && body.sets !== null) {
    if (!Array.isArray(body.sets)) {
      errors.push({ field: "sets", message: "Sets must be an array" });
    } else {
      const allPositive = body.sets.every(
        (v: unknown) => typeof v === "number" && v >= 0
      );
      if (!allPositive) {
        errors.push({ field: "sets", message: "All set values must be non-negative numbers" });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate import data
 */
export function validateImportData(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "body", message: "Invalid import data" }] };
  }

  const body = data as Record<string, unknown>;

  if (body.version !== "1.0") {
    errors.push({ field: "version", message: "Unsupported data version" });
  }

  if (!Array.isArray(body.challenges)) {
    errors.push({ field: "challenges", message: "Challenges must be an array" });
  }

  if (!Array.isArray(body.entries)) {
    errors.push({ field: "entries", message: "Entries must be an array" });
  }

  return { valid: errors.length === 0, errors };
}

// Helper: check if string is a valid date (YYYY-MM-DD)
function isValidDate(dateStr: string): boolean {
  if (typeof dateStr !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}
