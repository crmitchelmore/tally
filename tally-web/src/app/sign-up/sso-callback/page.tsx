import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { getClerkPublishableKey } from "@/lib/clerk-public";
import { ClerkProviderWrapper } from "@/providers/clerk-provider-wrapper";

export default function SignUpSSOCallbackPage() {
  const publishableKey = getClerkPublishableKey();
  if (!publishableKey) return null;
  return (
    <ClerkProviderWrapper publishableKey={publishableKey}>
      <AuthenticateWithRedirectCallback redirectUrl="/app" />
    </ClerkProviderWrapper>
  );
}
