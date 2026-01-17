import type { ReactNode } from "react";

export const metadata = {
  title: "Tally",
  description: "A calm, honest way to track what matters.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
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
}
