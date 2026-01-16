import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Track what matters
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Tally helps you make progress toward your goals with a tactile, 
              fast, and honest experience. No gimmicks—just you versus your goal.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/sign-up"
                className="rounded-2xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-colors"
              >
                Create an account
              </Link>
              <Link
                href="/sign-in"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 transition-colors"
              >
                Sign in <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
                    <span className="text-white font-mono">1</span>
                  </div>
                  Set a challenge
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Pick a goal and timeframe—yearly, monthly, or custom dates.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
                    <span className="text-white font-mono">2</span>
                  </div>
                  Log your progress
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Tap to add entries. Track counts or sets with instant feedback.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
                    <span className="text-white font-mono">3</span>
                  </div>
                  Stay on pace
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  See where you stand and what you need to reach your target.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to start tracking?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Join Tally and make every day count toward your goals.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/app"
                className="rounded-2xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-colors"
              >
                Open app
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center gap-x-6 md:order-2">
            <Link href="/ios" className="text-gray-400 hover:text-gray-500">
              iOS (coming soon)
            </Link>
            <Link href="/android" className="text-gray-400 hover:text-gray-500">
              Android (coming soon)
            </Link>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500">
              &copy; {new Date().getFullYear()} Tally. Track what matters.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
