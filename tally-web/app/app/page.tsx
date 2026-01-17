import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

export default async function AppShell() {
  const user = await currentUser();
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          lineHeight: "1.2",
          margin: 0,
        }}
      >
        {user?.firstName ? `Welcome back, ${user.firstName}.` : "Tally app shell"}
      </h1>
      <p
        style={{
          margin: 0,
          color: "#4b4b4b",
        }}
      >
        This is the early /app placeholder while we wire up the full product.
      </p>
      <Link
        href="/"
        style={{
          color: "#b21f24",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Back to landing
      </Link>
    </main>
  );
}
