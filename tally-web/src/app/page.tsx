import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
      <header className="w-full border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Tally
          </span>
          <Link
            href="/app"
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            Open App
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
          {/* Tally mark visual */}
          <div
            className="flex items-end gap-1 text-stone-400 dark:text-stone-600"
            aria-hidden="true"
          >
            <span className="inline-block h-10 w-1 rounded-full bg-current" />
            <span className="inline-block h-10 w-1 rounded-full bg-current" />
            <span className="inline-block h-10 w-1 rounded-full bg-current" />
            <span className="inline-block h-10 w-1 rounded-full bg-current" />
            <span className="-ml-5 inline-block h-12 w-1 origin-bottom -rotate-45 rounded-full bg-red-500" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
            Track what matters
          </h1>

          <p className="max-w-md text-lg text-stone-600 dark:text-stone-400">
            A friendly, fast way to count progress toward your goals. Build
            momentum, see your pace, and celebrate the small wins.
          </p>

          <Link
            href="/app"
            className="mt-4 rounded-full bg-stone-900 px-8 py-3 text-base font-medium text-stone-50 transition-colors hover:bg-stone-700 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            Get Started
          </Link>
        </div>
      </main>

      <footer className="w-full border-t border-stone-200 dark:border-stone-800">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-sm text-stone-500 dark:text-stone-500">
          © {new Date().getFullYear()} Tally
        </div>
      </footer>
    </div>
  );
}
