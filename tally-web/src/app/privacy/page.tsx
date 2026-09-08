import Link from "next/link";
export const metadata = { title: "Privacy policy · Tally" };
export default function Privacy() {
  return <main className="mx-auto max-w-2xl px-6 py-16 space-y-6">
    <Link href="/">← Tally</Link><h1 className="text-3xl font-semibold">Tally privacy policy</h1>
    <p>Updated 8 September 2026. Tally Tracker is provided by Chris Mitchelmore. For privacy questions, contact <a className="underline" href="mailto:chrismitchelmore@gmail.com">chrismitchelmore@gmail.com</a>.</p>
    <h2 className="text-xl font-semibold">Your progress and account</h2>
    <p>You can use Tally locally without creating an account. In local mode, goals and entries stay on your device unless you export or choose to sync them. If you sign in, we process your name, email, account ID, goals, dates, counts, sets, optional notes and feelings, follows and preferences to provide your account and sync. Clerk provides authentication and Convex stores synced data. Goals you make public and your public profile can be viewed by other users.</p>
    <h2 className="text-xl font-semibold">Optional analytics and diagnostics</h2>
    <p>Usage analytics helps us understand which features are useful. PostHog receives feature-use events, app/browser and device information, a random device identifier and, on signed-in web and iOS sessions, your account ID. We use PostHog&apos;s EU region. Native analytics does not include goal names, notes, entry contents or screen recordings.</p>
    <p>Crash reporting sends error details, stack traces, app/browser and device information to Sentry to diagnose failures. Native crash reporting excludes screenshots, screen recordings and account details. We do not sell your data, use advertising identifiers, or track you across other companies&apos; apps for advertising.</p>
    <p>On iOS and Android, analytics and crash reporting are separately optional and off until you enable them. Change your choice under Settings → Analytics &amp; crash reports. Turning a choice off stops future optional collection from that device. Essential authentication, sync, hosting and security records are still processed to run the service. The website also uses PostHog analytics and Sentry diagnostics; browser Do Not Track is respected by PostHog.</p>
    <h2 className="text-xl font-semibold">Service providers and storage</h2>
    <p>We use Clerk for accounts, Convex for cloud data, Vercel and Cloudflare for hosting and delivery, PostHog for analytics and Sentry for diagnostics. Providers process data on our behalf and may process it outside your country. Network services receive IP addresses to deliver requests. Data is encrypted in transit. Apple and Google handle optional store payments; we do not receive your payment card details.</p>
    <h2 className="text-xl font-semibold">Your choices, retention and deletion</h2>
    <p>Export your data from Settings. Deleting individual items can move them to Trash, where they may be recoverable. To permanently remove your account and cloud records, use <Link className="underline" href="/delete-account">Delete your Tally account</Link>. This includes previously deleted items. Remove offline copies separately on each device. Backup, security and legally required transaction records may remain for their necessary retention period. Contact us for access, correction, deletion of historical analytics, or other privacy requests. You may also complain to the UK Information Commissioner&apos;s Office.</p>
    <p>Tally is a general-purpose progress tracker and is not directed at children under 13. Do not place sensitive information in public goals. We will update this page when our practices change.</p>
    <Link className="underline" href="/support">Support</Link>
  </main>;
}
