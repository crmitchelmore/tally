import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import "./globals.css";

// Load AnalyticsProvider only on client to avoid posthog-js SSR issues
const AnalyticsProvider = dynamic(
  () => import("@/components/providers/AnalyticsProvider").then(mod => mod.AnalyticsProvider),
  { ssr: false }
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tally - Track what matters",
  description: "Track progress toward your goals with a tactile, fast, honest experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider proxyUrl="/__clerk">
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            <Suspense fallback={null}>
              <AnalyticsProvider>{children}</AnalyticsProvider>
            </Suspense>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
