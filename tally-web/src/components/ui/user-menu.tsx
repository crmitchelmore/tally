"use client";

import Link from "next/link";
import Image from "next/image";

interface UserMenuProps {
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  } | null;
  onSignOut?: () => void;
  className?: string;
}

/**
 * User menu showing avatar that links to settings.
 * Shows sign-in CTA when user is null.
 */
export function UserMenu({ user, className = "" }: UserMenuProps) {
  if (!user) {
    return (
      <Link
        href="/sign-in"
        className={`
          px-4 py-2 rounded-full bg-accent text-white text-sm font-semibold
          hover:bg-accent/90 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
          ${className}
        `}
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-sm font-medium text-ink dark:text-paper truncate max-w-[120px]">
          {user.name}
        </span>
        {user.email && (
          <span className="text-xs text-muted truncate max-w-[120px]">
            {user.email}
          </span>
        )}
      </div>
      <Link
        href="/app/settings"
        className="
          w-9 h-9 rounded-full bg-ink/10 dark:bg-paper/10
          flex items-center justify-center text-sm font-medium
          hover:bg-ink/20 dark:hover:bg-paper/20 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
        "
        aria-label={`Signed in as ${user.name}. Click to open settings.`}
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={36}
            height={36}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-ink dark:text-paper">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </Link>
    </div>
  );
}

export default UserMenu;
