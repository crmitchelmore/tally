import Link from "next/link";

export default function AppPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
      <header className="w-full border-b border-stone-200 dark:border-stone-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50"
          >
            Tally
          </Link>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            App
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <div
            className="flex items-end gap-1 text-stone-300 dark:text-stone-700"
            aria-hidden="true"
          >
            <span className="inline-block h-8 w-1 rounded-full bg-current" />
            <span className="inline-block h-8 w-1 rounded-full bg-current" />
            <span className="inline-block h-8 w-1 rounded-full bg-current" />
            <span className="inline-block h-8 w-1 rounded-full bg-current" />
            <span className="-ml-4 inline-block h-10 w-1 origin-bottom -rotate-45 rounded-full bg-red-400" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Your challenges
          </h1>

          <p className="text-stone-600 dark:text-stone-400">
            Sign in to start tracking your progress.
          </p>

          <button
            type="button"
            className="mt-2 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            Sign in
          </button>
        </div>
      </main>
    </div>
  );
}
