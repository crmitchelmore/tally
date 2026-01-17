import { ComingSoonPage } from "../ui/coming-soon";

export default function IOSPage() {
  return (
    <ComingSoonPage
      platform="iOS"
      headline="iPhone ink, tuned for calm focus."
      subhead="The Tally iOS experience is in final polish. You will get the same
        honest marks, offline-first logging, and gentle pace signals in a native
        home."
      deviceNote="Built for one-hand taps"
      cards={[
        {
          label: "iOS App Store",
          detail: "Native iOS build in review with TestFlight spots soon.",
        },
        {
          label: "Private beta",
          detail: "We are inviting early testers who log daily with Tally.",
        },
      ]}
    />
  );
}
