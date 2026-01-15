import Link from "next/link";

import { SiteShell } from "../components/site-shell";

export default function IosPage() {
  return (
    <SiteShell>
      <section className="pb-20 pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              iOS app
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Tally for iPhone is on the way.
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Native SwiftUI, offline-first logging, and the same calm momentum you get on the web.
              We&apos;re polishing the experience before launch.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/app"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.6)] transition hover:bg-slate-800"
              >
                Open the web app
              </Link>
              <a href="mailto:hello@tally.app" className="text-sm font-semibold text-slate-600">
                Get launch updates →
              </a>
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]">
            <div className="h-10 rounded-2xl bg-slate-100" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="h-20 rounded-2xl bg-slate-100" />
              <div className="h-20 rounded-2xl bg-slate-100" />
              <div className="h-20 rounded-2xl bg-slate-100" />
            </div>
            <div className="mt-4 h-32 rounded-2xl bg-slate-100" />
            <p className="mt-4 text-sm text-slate-600">
              Store preview coming soon. Expect the same tally-first UI in a native feel.
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
