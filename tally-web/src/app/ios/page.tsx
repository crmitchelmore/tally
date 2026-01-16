import Link from "next/link";

export const metadata = {
  title: "Tally for iOS - Coming Soon",
  description: "Track your goals on iPhone with Tally. Native iOS app coming soon.",
};

export default function IOSPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        {/* Header */}
        <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-8 transition-colors">
          ← Back to Home
        </Link>

        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 mb-8 shadow-lg">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Tally for iOS
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Native iPhone app coming soon. Track your goals with a tactile, focused experience designed for iOS.
          </p>

          {/* Notify Form */}
          <div className="bg-slate-800/50 rounded-2xl p-6 sm:p-8 max-w-md mx-auto mb-12 border border-slate-700">
            <h2 className="text-lg font-semibold mb-4">Get notified when we launch</h2>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
              >
                Notify Me
              </button>
            </form>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="text-2xl mb-3">📱</div>
              <h3 className="font-semibold mb-2">Native Experience</h3>
              <p className="text-sm text-slate-400">Built with SwiftUI for a smooth, native iOS feel</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="text-2xl mb-3">🔄</div>
              <h3 className="font-semibold mb-2">Sync Everywhere</h3>
              <p className="text-sm text-slate-400">Your progress syncs seamlessly with web and Android</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <div className="text-2xl mb-3">✨</div>
              <h3 className="font-semibold mb-2">Widgets & Haptics</h3>
              <p className="text-sm text-slate-400">Home screen widgets and tactile feedback</p>
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
