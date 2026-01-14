import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getClerkPublishableKey } from "@/lib/clerk-public";
import { ClerkProviderWrapper } from "@/providers/clerk-provider-wrapper";
import { ConvexClientProvider } from "@/providers/convex-provider";
import { FeatureFlagsProvider } from "@/providers/feature-flags-provider";
import { PostHogProvider } from "@/providers/posthog-provider";
import { SentryProvider } from "@/providers/sentry-provider";
import { AppModeProvider } from "@/providers/app-mode-provider";
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

  const app = (
    <SentryProvider>
      <PostHogProvider>
        <FeatureFlagsProvider>
          <ConvexClientProvider>
            <AppModeProvider>
              {children}
              <Toaster />
            </AppModeProvider>
          </ConvexClientProvider>
        </FeatureFlagsProvider>
      </PostHogProvider>
    </SentryProvider>
  );

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {clerkPublishableKey ? (
          <ClerkProviderWrapper publishableKey={clerkPublishableKey}>{app}</ClerkProviderWrapper>
        ) : (
          app
        )}
      </body>
    </html>
  );
}
