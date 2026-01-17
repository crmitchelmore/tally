import { ComingSoonPage } from "../ui/coming-soon";

export default function AndroidPage() {
  return (
    <ComingSoonPage
      platform="Android"
      headline="Android ink that keeps pace with you."
      subhead="Tally for Android is coming soon with the same fast taps, offline
        confidence, and pace signals you already see on the web."
      deviceNote="Optimized for quick thumbs"
      cards={[
        {
          label: "Google Play",
          detail: "Store listing is being prepared with calm onboarding.",
        },
        {
          label: "Early access",
          detail: "Join the early access list as we finish the final sync pass.",
        },
      ]}
    />
  );
}
