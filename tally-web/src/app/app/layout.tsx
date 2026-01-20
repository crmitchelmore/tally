"use client";

import { AppHeader } from "@/components/ui/app-header";
import { useUser, useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const syncState = "synced" as const;

  // Provision user on sign-in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetch("/api/v1/auth/user", { method: "POST" }).catch(console.error);
    }
  }, [isLoaded, isSignedIn]);

  const appUser = isLoaded && isSignedIn && user
    ? {
        name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "User",
        avatarUrl: user.imageUrl,
      }
    : null;

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader
        user={appUser}
        syncState={syncState}
        onSignOut={() => {
          signOut({ redirectUrl: "/" });
        }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
