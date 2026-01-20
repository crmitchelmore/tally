import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// In-memory user store (will be replaced with Convex later)
const users = new Map<string, { id: string; clerkId: string; email: string; name: string; createdAt: string; updatedAt: string }>();

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already exists
    let existingUser = Array.from(users.values()).find((u) => u.clerkId === clerkId);
    
    if (existingUser) {
      // Update user info
      existingUser.email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
      existingUser.name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "Anonymous";
      existingUser.updatedAt = new Date().toISOString();
      users.set(existingUser.id, existingUser);
      
      return NextResponse.json({ user: existingUser });
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "Anonymous",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    users.set(newUser.id, newUser);

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/v1/auth/user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = Array.from(users.values()).find((u) => u.clerkId === clerkId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in /api/v1/auth/user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
