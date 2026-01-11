export const CHALLENGE_ICONS = [
  'flame',
  'dumbbell',
  'heart',
  'target',
  'zap',
  'trophy',
  'star',
  'book-open',
  'coffee',
  'bike',
  'footprints',
  'pen-tool',
  'camera',
  'music',
  'palette',
  'code',
  'rocket',
  'sun',
  'moon',
  'cloud',
] as const

export const CHALLENGE_COLORS = [
  { name: 'Charcoal', value: 'oklch(0.25 0.02 30)' },
  { name: 'Slate', value: 'oklch(0.35 0.03 240)' },
  { name: 'Forest', value: 'oklch(0.4 0.15 145)' },
  { name: 'Navy', value: 'oklch(0.35 0.12 250)' },
  { name: 'Plum', value: 'oklch(0.4 0.15 310)' },
  { name: 'Rust', value: 'oklch(0.5 0.18 35)' },
  { name: 'Olive', value: 'oklch(0.45 0.12 100)' },
  { name: 'Brick', value: 'oklch(0.45 0.18 20)' },
  { name: 'Teal', value: 'oklch(0.45 0.12 190)' },
  { name: 'Moss', value: 'oklch(0.42 0.14 135)' },
  { name: 'Indigo', value: 'oklch(0.38 0.15 270)' },
  { name: 'Clay', value: 'oklch(0.48 0.12 50)' },
]

export const QUICK_ADD_PRESETS = [1, 5, 10, 25, 50, 100]

export const FEELING_OPTIONS = [
  { type: 'very-easy' as const, emoji: '😊', label: 'Very Easy', description: 'Felt effortless' },
  { type: 'easy' as const, emoji: '🙂', label: 'Easy', description: 'Comfortable pace' },
  { type: 'moderate' as const, emoji: '😐', label: 'Moderate', description: 'Solid effort' },
  { type: 'hard' as const, emoji: '😤', label: 'Hard', description: 'Challenging' },
  { type: 'very-hard' as const, emoji: '🥵', label: 'Very Hard', description: 'Maximal effort' },
] as const
