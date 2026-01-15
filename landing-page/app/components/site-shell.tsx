import Link from "next/link";

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Sync", href: "/#sync" },
  { label: "App", href: "/#app" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-[var(--paper)]/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Tally
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
                {item.label}
              </Link>
            ))}
            <Link
              href="/app"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open app
            </Link>
          </nav>
          <Link
            href="/app"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 md:hidden"
          >
            Open app
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-6">
        {children}
      </main>

      <footer className="mt-24 border-t border-slate-200/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Tally. Build momentum with every mark.</p>
          <div className="flex gap-6">
            <Link href="/ios" className="transition hover:text-slate-700">
              iOS
            </Link>
            <Link href="/android" className="transition hover:text-slate-700">
              Android
            </Link>
            <a href="mailto:hello@tally.app" className="transition hover:text-slate-700">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
