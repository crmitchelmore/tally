import Link from "next/link";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Target className="h-5 w-5" />
            <span>Tally</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/app">
              <Button>
                Open app <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Simple, fast habit tracking
              </div>
              <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight md:text-6xl">
                Track anything you care about — one tally at a time.
              </h1>
              <p className="mt-5 text-pretty text-lg text-muted-foreground md:text-xl">
                Create challenges, log progress in seconds, and see momentum build across days, weeks, and years.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/app">
                  <Button size="lg">
                    Open the app <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="lg" variant="outline">
                    Create an account
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">iOS + Android apps coming soon.</p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Frictionless logging</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Add entries in seconds. Perfect for reps, pages read, practice sessions, or anything countable.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Progress you can feel</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Clear stats and at-a-glance summaries so you always know where you stand.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Built for consistency</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Designed around momentum — small wins, repeated daily, compound into real change.
              </CardContent>
            </Card>
          </div>
        </section>

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
                <Button>Open app</Button>
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
          </div>
        </div>
      </footer>
    </div>
  );
}

