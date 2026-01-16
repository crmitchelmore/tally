import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { ClientAnalyticsProvider } from "@/components/providers/ClientAnalyticsProvider";
import { Suspense } from "react";
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
              <ClientAnalyticsProvider>{children}</ClientAnalyticsProvider>
            </Suspense>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
