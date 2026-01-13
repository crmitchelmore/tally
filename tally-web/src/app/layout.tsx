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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = getClerkPublishableKey();
  
  // Use proxy URL in production to bypass Cloudflare for SaaS conflict.
  // The clerk.tally-tracker.app CNAME triggers Cloudflare Error 1000 because both
  // our DNS and Clerk's infrastructure use Cloudflare.
  const isProduction = process.env.NODE_ENV === "production" && 
                       clerkPublishableKey?.startsWith("pk_live_");
  const proxyUrl = isProduction ? "/__clerk" : undefined;

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
          <ClerkProvider publishableKey={clerkPublishableKey} proxyUrl={proxyUrl}>{app}</ClerkProvider>
        ) : (
          app
        )}
      </body>
    </html>
  );
}
