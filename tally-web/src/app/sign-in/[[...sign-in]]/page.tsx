import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
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
    </div>
  );
}
