"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

function useSafeUser() {
  try {
    return useUser();
  } catch {
    return {
      user: null,
      isLoaded: true,
      isSignedIn: false,
    } as unknown as ReturnType<typeof useUser>;
  }
}

export function useStoreUser() {
  const { user, isLoaded } = useSafeUser();
  const storeUser = useMutation(api.users.getOrCreate);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      const userId = await storeUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? undefined,
        avatarUrl: user.imageUrl,
      });
      setConvexUserId(userId);
    };

    syncUser();
  }, [isLoaded, user, storeUser]);

  return { convexUserId, isLoaded: isLoaded && (user ? convexUserId !== null : true) };
}

export function useCurrentUser() {
  const { user, isLoaded: isClerkLoaded } = useSafeUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  return {
    user: convexUser,
    isLoaded: isClerkLoaded && (user ? convexUser !== undefined : true),
  };
}
