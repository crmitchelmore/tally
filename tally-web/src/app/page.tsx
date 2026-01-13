import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cloud,
  Lock,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LandingHeroDemo } from "@/components/tally/LandingHeroDemo";
import { AppShowcase, FeatureShowcase } from "@/components/marketing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background tally-marks-bg">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Target className="h-5 w-5" />
            <span className="tracking-tight">Tally</span>
            <span
              aria-hidden
              className="ml-1 inline-block h-1.5 w-6 rounded-full bg-[var(--tally-cross)]"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/app">
              <Button className="bg-[var(--tally-cross)] text-white hover:opacity-90">
                Open app <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,oklch(0.55_0.22_25_/_0.18),transparent_60%)]"
          />
          <div className="container mx-auto px-4 py-14 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-sm text-muted-foreground shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Calm momentum tracking
                </div>
                <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight md:text-6xl">
                  Track anything you care about —
                  <span className="text-[color:var(--tally-cross)]"> one tally</span> at a time.
                </h1>
                <p className="mt-5 max-w-xl text-pretty text-lg text-muted-foreground md:text-xl">
                  Create a challenge, tap +1 in seconds, and watch small wins compound into real progress.
                </p>

                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="bg-[var(--tally-cross)] text-white hover:opacity-90"
                    >
                      Create an account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/app">
                    <Button size="lg" variant="outline">
                      Open the app
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full bg-[var(--tally-cross)]"
                    />
                    Fast on the web today
                  </span>
                  <span className="hidden sm:inline">·</span>
                  <span>iOS + Android coming soon</span>
                </div>

                <div className="mt-6 flex flex-col items-start gap-2 sm:flex-row">
                  <Link href="/ios">
                    <Button variant="outline">iOS</Button>
                  </Link>
                  <Link href="/android">
                    <Button variant="outline">Android</Button>
                  </Link>
                </div>
              </div>

              <div className="lg:justify-self-end">
                <LandingHeroDemo />
                <p className="mt-3 text-xs text-muted-foreground">
                  No pressure — it’s just a tiny demo.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Built for consistency, not complexity.
              </h2>
              <p className="mt-2 text-muted-foreground">
                A calm interface with just enough delight to keep you coming back.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-6">
            <Card className="rounded-2xl md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[color:var(--tally-cross)]" />
                  Frictionless logging
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Add entries in seconds — perfect for reps, pages, sessions, or anything countable.
              </CardContent>
            </Card>

            <Card className="rounded-2xl md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[color:var(--tally-cross)]" />
                  Progress you can feel
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Clear stats and a visual history so you always know where you stand.
              </CardContent>
            </Card>

            <Card className="rounded-2xl md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[color:var(--tally-cross)]" />
                  Small delight
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Microinteractions that teach the interface — never loud, always helpful.
              </CardContent>
            </Card>

            <Card className="rounded-2xl md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-[color:var(--tally-cross)]" />
                  Instant sync
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Updates show up quickly across devices so your progress feels trustworthy.
              </CardContent>
            </Card>

            <Card className="rounded-2xl md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[color:var(--tally-cross)]" />
                  Calm + private
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                High contrast, sensible motion, and privacy-first defaults.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature showcases with video placeholders */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4">
            <FeatureShowcase
              title="One tap to track progress"
              description="No friction, no fuss. Just tap +1 whenever you complete a rep, read a page, or tick off a habit. Your progress updates instantly."
              mediaPosition="left"
              badge="Core feature"
            />

            <FeatureShowcase
              title="Watch momentum build"
              description="Beautiful charts and streak counters show your consistency over time. Small wins compound into something you can be proud of."
              mediaPosition="right"
              badge="Visual progress"
            />

            <FeatureShowcase
              title="Join challenges together"
              description="Follow public challenges, compete on leaderboards, and stay motivated with a community of people working toward similar goals."
              mediaPosition="left"
              badge="Community"
            />
          </div>
        </section>

        {/* App showcase section */}
        <AppShowcase className="border-t" />

        <section className="border-t">
          <div className="container mx-auto flex flex-col items-start justify-between gap-6 px-4 py-10 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold">Ready to start?</h2>
              <p className="mt-1 text-muted-foreground">Sign in and pick your first challenge.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/sign-in">
                <Button variant="outline">Sign in</Button>
              </Link>
              <Link href="/app">
                <Button className="bg-[var(--tally-cross)] text-white hover:opacity-90">
                  Open app
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© Tally</p>
          <div className="flex gap-4">
            <Link href="/sign-in" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/app" className="hover:text-foreground">
              App
            </Link>
            <Link href="/ios" className="hover:text-foreground">
              iOS
            </Link>
            <Link href="/android" className="hover:text-foreground">
              Android
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

