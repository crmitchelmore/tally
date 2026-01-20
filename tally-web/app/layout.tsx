import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Tally",
  description: "A calm, honest way to track what matters.",
};

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY;
const hasClerkEnv = !!clerkPublishableKey && !!process.env.CLERK_SECRET_KEY;

export default function RootLayout({ children }: { children: ReactNode }) {
  const content = (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: "#f7f7f5",
          color: "#141414",
        }}
      >
        {children}
      </body>
    </html>
  );

  // If Clerk isn't configured, don't blow up during prerender/SSR.
  // This keeps marketing/public pages alive and avoids global 500s.
  return hasClerkEnv ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>{content}</ClerkProvider>
  ) : (
    content
  );
}
