import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AndroidPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight">Tally for Android</h1>
        <p className="mt-3 text-muted-foreground">
          We’re getting the Android app ready. For now, you can use the web app.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/app">
            <Button>
              Open the web app <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" disabled aria-disabled="true" title="Coming soon">
            <Play className="mr-2 h-4 w-4" />
            Google Play (coming soon)
          </Button>
        </div>
      </div>
    </main>
  );
}
