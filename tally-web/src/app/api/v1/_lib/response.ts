/**
 * Response helpers for consistent API responses
 */
import { NextResponse } from "next/server";
import type { ApiError, PaginatedResponse, ValidationError } from "./types";

/**
 * Success response with data
 */
export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Success response for created resource
 */
export function jsonCreated<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

/**
 * Paginated success response
 */
export function jsonPaginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): NextResponse {
  const response: PaginatedResponse<T> = {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
  return NextResponse.json(response);
}

/**
 * Error: Bad request (400)
 */
export function jsonBadRequest(
  message: string,
  details?: ValidationError[]
): NextResponse {
  const error: ApiError = { error: message, code: "BAD_REQUEST" };
  if (details && details.length > 0) {
    error.details = details.reduce(
      (acc, e) => ({ ...acc, [e.field]: e.message }),
      {}
    );
  }
  return NextResponse.json(error, { status: 400 });
}

/**
 * Error: Unauthorized (401)
 */
export function jsonUnauthorized(message = "Unauthorized"): NextResponse {
  const error: ApiError = { error: message, code: "UNAUTHORIZED" };
  return NextResponse.json(error, { status: 401 });
}

/**
 * Error: Forbidden (403)
 */
export function jsonForbidden(message = "Forbidden"): NextResponse {
  const error: ApiError = { error: message, code: "FORBIDDEN" };
  return NextResponse.json(error, { status: 403 });
}

/**
 * Error: Not found (404)
 */
export function jsonNotFound(message = "Not found"): NextResponse {
  const error: ApiError = { error: message, code: "NOT_FOUND" };
  return NextResponse.json(error, { status: 404 });
}

/**
 * Error: Internal server error (500)
 */
export function jsonInternalError(message = "Internal server error"): NextResponse {
  const error: ApiError = { error: message, code: "INTERNAL_ERROR" };
  return NextResponse.json(error, { status: 500 });
}
