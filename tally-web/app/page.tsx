import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "48px 24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#6b6b6b",
          margin: 0,
        }}
      >
        Tally
      </p>
      <h1
        style={{
          fontSize: "40px",
          lineHeight: "1.1",
          margin: 0,
          maxWidth: "520px",
        }}
      >
        Track progress with honest, ink-like marks.
      </h1>
      <p
        style={{
          margin: 0,
          maxWidth: "520px",
          color: "#4b4b4b",
        }}
      >
        A calm space to log what matters, stay on pace, and see momentum grow
        without pressure.
      </p>
      <Link
        href="/app"
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
        Open the app
      </Link>
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
            color: "#b21f24",
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
          }}
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
