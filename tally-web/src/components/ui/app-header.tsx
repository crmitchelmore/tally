"use client";

import Link from "next/link";
import { AppNav } from "./app-nav";
import { SyncIndicator } from "./sync-indicator";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { TallyMark } from "./tally-mark";

interface AppHeaderProps {
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  } | null;
  syncState?: "offline" | "syncing" | "synced" | "error";
  pendingCount?: number;
  onSignOut?: () => void;
}

/**
 * App header with logo, navigation, sync status, and user menu.
 * Desktop-first responsive design.
 */
export function AppHeader({
  user,
  syncState = "synced",
  pendingCount = 0,
  onSignOut,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-paper/80 dark:bg-paper/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/app"
              className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
            >
              <TallyMark count={5} size="sm" className="text-ink dark:text-paper" />
              <span className="text-lg font-semibold text-ink dark:text-paper">
                Tally
              </span>
            </Link>
            <div className="hidden md:block">
              <AppNav />
            </div>
          </div>

          {/* Right side: sync, theme, user */}
          <div className="flex items-center gap-4">
            <SyncIndicator state={syncState} pendingCount={pendingCount} />
            <ThemeToggle />
            <UserMenu user={user} onSignOut={onSignOut} />
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden pb-3">
          <AppNav />
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
