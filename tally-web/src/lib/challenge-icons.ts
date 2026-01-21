/**
 * Maps challenge icon values to their emoji representation.
 * Used across challenge cards and detail views.
 */
export const CHALLENGE_ICONS: Record<string, string> = {
  tally: "📊",
  run: "🏃",
  book: "📚",
  pen: "✍️",
  code: "💻",
  music: "🎵",
  heart: "❤️",
  star: "⭐",
  strength: "💪",
};

export function getIconEmoji(icon: string | undefined): string {
  return icon ? CHALLENGE_ICONS[icon] ?? "📊" : "📊";
}
