"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <TallyMark count={5} size="sm" />
              <span className="text-2xl font-semibold tracking-tight text-ink">tally</span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="local-mode-badge">
                Local mode
              </span>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Sign in
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
