import Link from "next/link";

import { SiteShell } from "../components/site-shell";

export default function WebAppPage() {
  return (
    <SiteShell>
      <section className="pb-20 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Web app preview
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            The full web app experience is landing soon.
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            We&apos;re building the complete challenge and entry flow. Until launch, explore the
            landing preview or request early access.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.6)] transition hover:bg-slate-800"
            >
              Back to the landing page
            </Link>
            <a href="mailto:hello@tally.app" className="text-sm font-semibold text-slate-600">
              Request early access →
            </a>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
