import Link from "next/link";

export const metadata = {
  title: "Tally for Android - Coming Soon",
  description: "Track your goals on Android with Tally. Native Android app coming soon.",
};

export default function AndroidPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        {/* Header */}
        <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-8 transition-colors">
          ← Back to Home
        </Link>

        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-600 mb-8 shadow-lg">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
            </svg>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Tally for Android
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Native Android app coming soon. Track your goals with Material Design and seamless Google integration.
          </p>

          {/* Notify Form */}
          <div className="bg-slate-800/50 rounded-2xl p-6 sm:p-8 max-w-md mx-auto mb-12 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4">Get notified when we launch</h2>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
              >
                Notify Me
              </button>
            </form>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="text-2xl mb-3">🤖</div>
              <h3 className="font-semibold mb-2">Material Design</h3>
              <p className="text-sm text-slate-400">Built with Jetpack Compose and Material 3</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="text-2xl mb-3">🔄</div>
              <h3 className="font-semibold mb-2">Sync Everywhere</h3>
              <p className="text-sm text-slate-400">Your progress syncs seamlessly with web and iOS</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Widgets & Shortcuts</h3>
              <p className="text-sm text-slate-400">Quick actions from your home screen</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-400 mb-4">Can&apos;t wait? Start tracking now on web</p>
          <Link
            href="/sign-up"
            className="inline-flex items-center px-6 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            Get Started Free →
          </Link>
        </div>
      </div>
    </main>
  );
}
