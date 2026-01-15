import Link from "next/link";

import { FeatureShowcase } from "./components/feature-showcase";
import { HeroDemo } from "./components/hero-demo";
import { SiteShell } from "./components/site-shell";

const steps = [
  {
    title: "Create a challenge",
    description: "Name the goal, set the timeframe, pick a color you love.",
  },
  {
    title: "Log a mark",
    description: "Tap once to add today&apos;s effort. Offline is fine—we&apos;ll sync later.",
  },
  {
    title: "See your pace",
    description: "Know exactly where you stand without guilt or noise.",
  },
];

const testimonials = [
  {
    quote:
      "Tally feels like a notebook I actually open. The pace cues are gentle but honest.",
    name: "Rhea G.",
    role: "Writer",
  },
  {
    quote:
      "I log workouts in seconds. Seeing the tally marks pile up is surprisingly motivating.",
    name: "Mateo L.",
    role: "Coach",
  },
];

const stats = [
  { label: "Average log time", value: "4s" },
  { label: "Offline-ready", value: "100%" },
  { label: "Calm check-ins", value: "Daily" },
];

const syncStates = [
  {
    label: "Queued",
    description: "Saved locally, ready to sync.",
    accent: "bg-slate-200",
  },
  {
    label: "Syncing",
    description: "Sending marks to your devices.",
    accent: "bg-[#d46b4a]/20",
  },
  {
    label: "Up to date",
    description: "All tallies match everywhere.",
    accent: "bg-emerald-100",
  },
];

const appScreens = [
  {
    title: "Dashboard",
    description: "Active challenges, pace status, and one-tap entry.",
  },
  {
    title: "Challenge detail",
    description: "Heatmap, streaks, and honest progress trends.",
  },
];

export default function Home() {
  return (
    <SiteShell>
      <section className="pb-20 pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Ink + momentum
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Build momentum you can feel.
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Tally turns small daily actions into visible progress. One tap to log, calm pacing
              guidance, and a record that feels like ink on paper.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/app"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.6)] transition hover:bg-slate-800"
              >
                Open the web app
              </Link>
              <a href="#how-it-works" className="text-sm font-semibold text-slate-600">
                See how it works →
              </a>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <HeroDemo />
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Feature spotlight
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">
              Focused tools for daily progress.
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-600">
              Each surface is designed to keep your numbers front and center while still feeling
              warm, tactile, and calm.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Explore the app
          </Link>
        </div>
        <div className="mt-10">
          <FeatureShowcase />
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">
              A simple loop you&apos;ll actually keep.
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Tally stays focused on your progress—no streak shame, just an honest pace and a
              satisfying place to log.
            </p>
            <Link
              href="/app"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[#d46b4a] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_-20px_rgba(212,107,74,0.6)] transition hover:bg-[#c85f40]"
            >
              Start a challenge
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Trusted calm
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">
              Built to feel like progress, not pressure.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="rounded-2xl border border-slate-200/70 bg-white/80 p-5"
              >
                <blockquote className="text-sm text-slate-600">“{testimonial.quote}”</blockquote>
                <figcaption className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {testimonial.name} · {testimonial.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="sync" className="py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Live sync
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">
              Offline-first, with clear states.
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-600">
              You can log anywhere. Tally shows exactly when entries are queued, syncing, or fully
              up to date.
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {syncStates.map((state) => (
            <div
              key={state.label}
              className="rounded-2xl border border-slate-200/70 bg-white/80 p-5"
            >
              <div className={`h-2 w-10 rounded-full ${state.accent}`} />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{state.label}</h3>
              <p className="mt-2 text-sm text-slate-600">{state.description}</p>
              <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-full w-2/3 rounded-full bg-slate-900/80 motion-safe:animate-pulse motion-reduce:animate-none"
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="app" className="py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              App preview
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">
              Honest visuals, no hype.
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-600">
              Real screens, real pacing. The UI stays clear so the numbers speak for themselves.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Open the demo app
          </Link>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {appScreens.map((screen) => (
            <div
              key={screen.title}
              className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                <span>{screen.title}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] text-slate-600">
                  Tally UI
                </span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="h-10 rounded-2xl bg-slate-100" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-20 rounded-2xl bg-slate-100" />
                  <div className="h-20 rounded-2xl bg-slate-100" />
                  <div className="h-20 rounded-2xl bg-slate-100" />
                </div>
                <div className="h-32 rounded-2xl bg-slate-100" />
              </div>
              <p className="mt-4 text-sm text-slate-600">{screen.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="rounded-[32px] border border-slate-200/70 bg-white/90 px-8 py-12 text-center shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Ready to tally
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900">
            Start building momentum today.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            Create your first challenge, log a mark, and feel the pace shift. Tally keeps you
            focused on what matters.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/app"
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-20px_rgba(15,23,42,0.6)] transition hover:bg-slate-800"
            >
              Open the web app
            </Link>
            <div className="text-sm text-slate-500">
              iOS + Android coming soon — <Link href="/ios">learn more</Link>.
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
