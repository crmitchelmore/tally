import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { getClerkPublishableKey } from "@/lib/clerk-public";
import { ConvexClientProvider } from "@/providers/convex-provider";
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider";
import { PostHogProvider } from "@/providers/posthog-provider";
import { SentryProvider } from "@/providers/sentry-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tally - Track Your Progress",
  description: "Track challenges and achievements with tally marks",
};

// Use proxy URL to bypass Cloudflare for SaaS DNS conflict
// The clerk.tally-tracker.app CNAME points to Clerk's Cloudflare, but until
// Clerk registers our domain as a custom hostname, we get Error 1000.
// This proxy forwards requests to Clerk's API directly from our server.
const clerkProxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL || "/__clerk";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = getClerkPublishableKey();

  const app = (
    <SentryProvider>
      <PostHogProvider>
        <FeatureFlagsProvider>
          <ConvexClientProvider>
            {children}
            <Toaster />
          </ConvexClientProvider>
        </FeatureFlagsProvider>
      </PostHogProvider>
    </SentryProvider>
  );

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {clerkPublishableKey ? (
          <ClerkProvider 
            publishableKey={clerkPublishableKey}
            proxyUrl={clerkProxyUrl}
          >
            {app}
          </ClerkProvider>
        ) : (
          app
        )}
      </body>
    </html>
  );
}
