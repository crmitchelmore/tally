import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tally",
  description: "Track what matters with calm, tactile progress.",
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
      {children}
    </body>
  );

  return (
    <html lang="en">
      {hasClerkKeys ? <ClerkProvider>{body}</ClerkProvider> : body}
    </html>
  );
}
