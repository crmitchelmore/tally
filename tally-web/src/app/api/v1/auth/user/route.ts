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

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return jsonUnauthorized();
    }

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
      
      return jsonOk({ user: existingUser });
    }

    // Create new user
    const newUser = createUser(
      clerkId,
      clerkUser.emailAddresses[0]?.emailAddress ?? "",
      `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "Anonymous"
    );

    return jsonCreated({ user: newUser });
  } catch (error) {
    console.error("Error in /api/v1/auth/user:", error);
    return jsonInternalError();
  }
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
