/**
 * Auth helpers for API routes
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export interface AuthResult {
  userId: string;
}

export interface AuthError {
  response: NextResponse;
}

/**
 * Require authentication for API routes.
 * Returns the Clerk userId or an error response.
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  const { userId } = await auth();

  if (!userId) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId };
}

/**
 * Type guard to check if auth result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return "response" in result;
}
