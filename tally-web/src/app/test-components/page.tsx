"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { TallyMarks, TallyCounter } from "@/components/tally/TallyMarks";
import { CircularProgress } from "@/components/tally/CircularProgress";

export default function TestComponentsPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Component Test Page</h1>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Badges</h2>
        <div className="flex gap-4 flex-wrap">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Card</CardTitle>
              <CardDescription>Track your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is a sample card with content.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Your weekly summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-muted-foreground">Total entries</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tally Marks</h2>
        <div className="space-y-4">
          <TallyMarks count={7} size="md" />
          <TallyMarks count={15} size="lg" animate />
          <TallyCounter count={23} label="Total Reps" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Circular Progress</h2>
        <div className="flex gap-8">
          <CircularProgress value={75} max={100} />
          <CircularProgress value={250} max={365} color="oklch(0.4 0.15 145)" />
          <CircularProgress value={1000} max={1000} color="oklch(0.55 0.22 25)" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Form Elements</h2>
        <div className="max-w-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter your name" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Skeletons</h2>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tally-specific Styles</h2>
        <div className="tally-marks-bg p-8 bg-card rounded-lg border">
          <p>This card has the tally marks background pattern.</p>
        </div>
      </section>
    </div>
  );
}
