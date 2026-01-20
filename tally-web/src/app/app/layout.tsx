"use client";

import { AppHeader } from "@/components/ui/app-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Wire up real user and sync state from auth/data providers
  const mockUser = null; // Will be replaced with Clerk user
  const syncState = "synced" as const;

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader
        user={mockUser}
        syncState={syncState}
        onSignOut={() => {
          // TODO: Implement sign out with Clerk
        }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
