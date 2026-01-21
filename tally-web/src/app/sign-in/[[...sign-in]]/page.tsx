import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "rounded-2xl shadow-sm border border-border",
            headerTitle: "text-ink font-semibold",
            headerSubtitle: "text-muted",
            socialButtonsBlockButton: "border-border hover:bg-ink/5",
            formFieldInput:
              "rounded-lg border-border focus:ring-accent focus:border-accent",
            formButtonPrimary: "bg-accent hover:bg-accent/90 rounded-full",
            footerActionLink: "text-accent hover:text-accent/80",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/app"
      />
      
      {/* Offline mode option */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted mb-2">Don&apos;t want to create an account?</p>
        <Link
          href="/offline"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink hover:text-accent transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
          Continue without account
        </Link>
        <p className="text-xs text-muted mt-1">
          Data stays on this device only
        </p>
      </div>
    </div>
  );
}
