import { auth, currentUser, clerkClient, verifyToken } from "@clerk/nextjs/server";
import { requireAuth, isAuthError } from "../../_lib/auth";
import {
  getUserByClerkId,
  createUser,
  updateUser,
} from "../../_lib/store";
import {
  jsonOk,
  jsonCreated,
  jsonUnauthorized,
  jsonNotFound,
  jsonInternalError,
} from "../../_lib/response";
import {
  captureEvent,
  withSpan,
  generateRequestId,
} from "@/lib/telemetry";
import { headers } from "next/headers";

/**
 * Get user ID from either cookie auth or Bearer token
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  // First try standard cookie-based auth
  const { userId } = await auth();
  if (userId) return userId;
  
  // Try Bearer token for mobile clients
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      return verifiedToken?.sub ?? null;
    } catch (error) {
      console.error("Bearer token verification failed:", error);
    }
  }
  
  return null;
}

export async function POST() {
  const requestId = generateRequestId();
  
  return withSpan("auth.provision_user", { request_id: requestId }, async (span) => {
    try {
      const clerkId = await getAuthenticatedUserId();
      
      if (!clerkId) {
        return jsonUnauthorized();
      }

      span.setAttribute("user.clerk_id", clerkId);

      // Get user details from Clerk
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkId);
      if (!clerkUser) {
        return jsonNotFound("User not found");
      }

      // Check if user already exists
      const existingUser = await getUserByClerkId(clerkId);
      
      if (existingUser) {
        // Update user info
        existingUser.email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
        existingUser.name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "Anonymous";
        await updateUser(existingUser);
        
        span.setAttribute("user.id", existingUser.id);
        span.setAttribute("user.is_new", false);
        
        return jsonOk({ user: existingUser });
      }

      // Create new user
      const newUser = await createUser(
        clerkId,
        clerkUser.emailAddresses[0]?.emailAddress ?? "",
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "Anonymous"
      );

      span.setAttribute("user.id", newUser.id);
      span.setAttribute("user.is_new", true);

      // Capture auth_signed_in event for new users
      await captureEvent("auth_signed_in", {
        userId: newUser.id,
        requestId,
      });

      return jsonCreated({ user: newUser });
    } catch (error) {
      console.error("Error in /api/v1/auth/user:", error);
      return jsonInternalError();
    }
  });
}

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const user = await getUserByClerkId(authResult.userId);
    
    if (!user) {
      return jsonNotFound("User not found");
    }

    return jsonOk({ user });
  } catch (error) {
    console.error("Error in /api/v1/auth/user:", error);
    return jsonInternalError();
  }
}
