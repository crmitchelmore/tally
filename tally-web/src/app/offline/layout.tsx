"use client";

import Link from "next/link";
import { TallyMark } from "@/components/ui/tally-mark";

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header matching app-header style */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <TallyMark count={4} size="sm" />
              <span className="font-semibold text-ink">Tally</span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
                Offline Mode
              </span>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Sign in to sync
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
