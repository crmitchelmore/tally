import Link from "next/link";
export const metadata = { title: "Support · Tally" };
export default function Support() {
  return <main className="mx-auto max-w-2xl px-6 py-16 space-y-6"><Link href="/">← Tally</Link><h1 className="text-3xl font-semibold">A little help with Tally</h1>
    <p>Create a goal, choose a target, then add an entry whenever you make progress. Use Settings to export a backup, change appearance or adjust privacy choices.</p>
    <p>For support, email <a className="underline" href="mailto:chrismitchelmore@gmail.com">chrismitchelmore@gmail.com</a>. Include your app version, device and what happened. Please avoid sending passwords or private goal contents.</p>
    <p>Local mode works without an account. Sign in to sync across devices. Export your local data before removing or reinstalling the app.</p>
    <p><Link className="underline" href="/delete-account">Delete your account and cloud data</Link> · <Link className="underline" href="/privacy">Privacy policy</Link></p>
  </main>;
}
