import { auth, currentUser } from "@clerk/nextjs/server";
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

export async function POST() {
  const requestId = generateRequestId();
  
  return withSpan("auth.provision_user", { request_id: requestId }, async (span) => {
    try {
      const { userId: clerkId } = await auth();
      
      if (!clerkId) {
        return jsonUnauthorized();
      }

      span.setAttribute("user.clerk_id", clerkId);

      const clerkUser = await currentUser();
      if (!clerkUser) {
        return jsonNotFound("User not found");
      }

      // Check if user already exists
      const existingUser = getUserByClerkId(clerkId);
      
      if (existingUser) {
        // Update user info
        existingUser.email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
        existingUser.name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "Anonymous";
        updateUser(existingUser);
        
        span.setAttribute("user.id", existingUser.id);
        span.setAttribute("user.is_new", false);
        
        return jsonOk({ user: existingUser });
      }

      // Create new user
      const newUser = createUser(
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

    const user = getUserByClerkId(authResult.userId);
    
    if (!user) {
      return jsonNotFound("User not found");
    }

    return jsonOk({ user });
  } catch (error) {
    console.error("Error in /api/v1/auth/user:", error);
    return jsonInternalError();
  }
}
