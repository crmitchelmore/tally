import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <SignUp
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
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/app"
      />
    </div>
  );
}
