export interface Challenge {
  id: string
  userId: string
  name: string
  targetNumber: number
  year: number
  color: string
  icon: string
  createdAt: string
  archived: boolean
}

export interface Set {
  reps: number
}

export type FeelingType = 'very-easy' | 'easy' | 'moderate' | 'hard' | 'very-hard'

export interface Entry {
  id: string
  userId: string
  challengeId: string
  date: string
  count: number
  note?: string
  sets?: Set[]
  feeling?: FeelingType
}

export interface ChallengeStats {
  total: number
  remaining: number
  daysLeft: number
  requiredPerDay: number
  currentStreak: number
  longestStreak: number
  bestDay: { date: string; count: number } | null
  averagePerDay: number
  daysActive: number
  paceStatus: 'ahead' | 'onPace' | 'behind'
  paceOffset: number
}

export interface HeatmapDay {
  date: string
  count: number
  level: number
}
