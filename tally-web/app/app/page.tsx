import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { ProvisionUser } from "./provision-user";
import EntriesClient from "../ui/entries/entries-client";

export default async function AppShell() {
  const user = await currentUser();
  if (!user) {
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
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#6b6b6b",
          }}
        >
          Tally
        </p>
        <h1
          style={{
            fontSize: "32px",
            lineHeight: "1.2",
            margin: 0,
          }}
        >
          Sign in to keep tallying.
        </h1>
        <p
          style={{
            margin: 0,
            color: "#4b4b4b",
            maxWidth: "320px",
          }}
        >
          Your progress lives in one calm place. Sign in to continue.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/sign-in"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "44px",
              padding: "0 24px",
              borderRadius: "999px",
              backgroundColor: "#b21f24",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            style={{
              color: "#b21f24",
              textDecoration: "none",
              fontWeight: 600,
              height: "44px",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Create account
          </Link>
        </div>
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
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "24px",
        padding: "48px 24px",
      }}
    >
      <ProvisionUser />
      <EntriesClient />
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
