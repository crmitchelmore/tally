import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TelemetryProvider } from "@/components/TelemetryProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tally",
  description: "Track what matters with calm, tactile progress.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

// Guard for missing Clerk keys during build
const hasClerkKeys =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <body className={`${inter.variable} font-sans antialiased`}>
      <TelemetryProvider>{children}</TelemetryProvider>
    </body>
  );

  return (
    <html lang="en">
      {hasClerkKeys ? (
        <ClerkProvider
          clerkJSUrl="https://cdn.clerk.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
        >
          {body}
        </ClerkProvider>
      ) : (
        body
      )}
    </html>
  );
}
