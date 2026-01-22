"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { ExportData } from "@/components/data/export-data";
import { ImportData } from "@/components/data/import-data";
import { ClearData } from "@/components/data/clear-data";
import { SessionsSync } from "@/components/settings/sessions-sync";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Settings page - account info, data management, and app preferences.
 */
export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleDataChange = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleSignOut = useCallback(() => {
    signOut({ redirectUrl: "/" });
  }, [signOut]);

  if (!isLoaded) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-border/50 rounded" />
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="h-16 w-16 bg-border/50 rounded-full mx-auto mb-4" />
          <div className="h-6 w-48 bg-border/50 rounded mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-semibold text-ink">Settings</h1>

      {/* Account section */}
      <section className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Account</h2>
        
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl font-semibold text-accent">
                  {(user.fullName || user.primaryEmailAddress?.emailAddress || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-ink">
                  {user.fullName || "Tally User"}
                </p>
                {user.primaryEmailAddress && (
                  <p className="text-sm text-muted">
                    {user.primaryEmailAddress.emailAddress}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 rounded-xl border border-border text-ink hover:bg-border/30 transition-colors text-left"
            >
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted">Sign out of your account on this device</p>
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted mb-4">Not signed in</p>
            <Link
              href="/sign-in"
              className="inline-block px-6 py-2 rounded-full bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </section>

      {/* Sessions & Sync section */}
      {user && <SessionsSync />}

      {/* Data Management section */}
      <section className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Data Management</h2>
        
        <div className="space-y-6">
          <ExportData />
          
          <div className="border-t border-border pt-6">
            <ImportData onImportComplete={handleDataChange} />
          </div>
          
          <div className="border-t border-border pt-6">
            <ClearData onClearComplete={handleDataChange} />
          </div>
        </div>
      </section>

      {/* About section */}
      <section className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">About</h2>
        <div className="space-y-2 text-sm text-muted">
          <p>Tally - Track what matters</p>
          <p>Version 1.0.0</p>
          <div className="flex gap-4 pt-2">
            <a href="https://tally-tracker.app" className="text-accent hover:underline">Website</a>
            <a href="mailto:support@tally-tracker.app" className="text-accent hover:underline">Support</a>
          </div>
        </div>
      </section>
    </div>
  );
}
