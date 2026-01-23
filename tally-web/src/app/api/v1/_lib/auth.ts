/**
 * Auth helpers for API routes
 * Supports both cookie-based (web) and Bearer token (mobile) authentication
 */
import { auth, clerkClient, verifyToken } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";

export interface AuthResult {
  userId: string;
}

export interface AuthError {
  response: NextResponse;
}

/**
 * Require authentication for API routes.
 * Supports both cookie-based auth (web) and Bearer token auth (mobile).
 * Returns the Clerk userId or an error response.
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  // First try the standard auth() which handles cookies
  const { userId } = await auth();
  
  if (userId) {
    console.log("[Auth] Authenticated via cookies, userId:", userId);
    return { userId };
  }
  
  // If no userId from cookies, try Bearer token from Authorization header
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log("[Auth] Bearer token found, length:", token.length, "prefix:", token.substring(0, 20));
    
    try {
      // Verify the session token using Clerk's verifyToken
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      
      console.log("[Auth] Token verified successfully, sub:", verifiedToken?.sub);
      
      if (verifiedToken?.sub) {
        return { userId: verifiedToken.sub };
      }
    } catch (error) {
      console.error("[Auth] Bearer token verification failed:", error);
    }
  } else {
    console.log("[Auth] No Bearer token in Authorization header");
  }

  return {
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

/**
 * Type guard to check if auth result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return "response" in result;
}
