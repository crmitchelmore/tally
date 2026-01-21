"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Challenges", href: "/app" },
  { label: "Community", href: "/app/community" },
  { label: "Settings", href: "/app/settings" },
];

/**
 * App navigation bar with desktop-first responsive design.
 */
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== "/app" && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
              ${isActive 
                ? "bg-accent/10 text-ink" 
                : "text-muted hover:text-ink hover:bg-ink/5"
              }
            `}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default AppNav;
