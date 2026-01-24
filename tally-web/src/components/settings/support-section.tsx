"use client";

import { useState } from "react";

export interface SupportSectionProps {
  className?: string;
}

/**
 * Support / Tip Jar section for settings page.
 * Links to Ko-fi and GitHub Sponsors (external - allowed on web).
 */
export function SupportSection({ className = "" }: SupportSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://ko-fi.com/crmitchelmore");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={`bg-surface border border-border rounded-2xl p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-ink mb-2">Support Development</h2>
      <p className="text-sm text-muted mb-4">
        Tally is free to use. Tips help fund continued development and new features.
      </p>

      <div className="space-y-3">
        {/* Ko-fi */}
        <a
          href="https://ko-fi.com/crmitchelmore"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 rounded-xl bg-paper border border-border hover:border-accent/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff5e5b]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">☕</span>
            </div>
            <div>
              <p className="font-medium text-ink group-hover:text-accent transition-colors">
                Buy me a coffee
              </p>
              <p className="text-sm text-muted">One-time tip via Ko-fi</p>
            </div>
          </div>
          <svg
            className="w-5 h-5 text-muted group-hover:text-accent transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>

        {/* GitHub Sponsors */}
        <a
          href="https://github.com/sponsors/crmitchelmore"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 rounded-xl bg-paper border border-border hover:border-accent/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">❤️</span>
            </div>
            <div>
              <p className="font-medium text-ink group-hover:text-accent transition-colors">
                GitHub Sponsors
              </p>
              <p className="text-sm text-muted">Monthly or one-time (0% fees)</p>
            </div>
          </div>
          <svg
            className="w-5 h-5 text-muted group-hover:text-accent transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>

        {/* Share/Copy link */}
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-between p-4 rounded-xl border border-border text-ink hover:bg-border/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium">{copied ? "Copied!" : "Share support link"}</p>
              <p className="text-sm text-muted">Tell a friend about Tally</p>
            </div>
          </div>
          <svg
            className="w-5 h-5 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      <p className="text-xs text-muted mt-4">
        Tips are optional and don&apos;t unlock additional features. Thank you for your support!
      </p>
    </section>
  );
}

export default SupportSection;
