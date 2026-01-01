import { Challenge, Entry, ChallengeStats, HeatmapDay } from '@/types'

export function getDaysInYear(year: number): number {
  return new Date(year, 11, 31).getDate() === 31 ? 365 : 366
}

export function getDaysLeftInYear(year: number): number {
  const now = new Date()
  const endOfYear = new Date(year, 11, 31, 23, 59, 59)
  if (now > endOfYear) return 0
  const diffTime = endOfYear.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function calculateStats(
  challenge: Challenge,
  entries: Entry[]
): ChallengeStats {
  const challengeEntries = entries.filter((e) => e.challengeId === challenge.id)
  const total = challengeEntries.reduce((sum, e) => sum + e.count, 0)
  const remaining = Math.max(0, challenge.targetNumber - total)
  const daysLeft = getDaysLeftInYear(challenge.year)
  const requiredPerDay = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0

  const dayMap = new Map<string, number>()
  challengeEntries.forEach((entry) => {
    const existing = dayMap.get(entry.date) || 0
    dayMap.set(entry.date, existing + entry.count)
  })

  const sortedDates = Array.from(dayMap.keys()).sort()

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  const today = new Date().toISOString().split('T')[0]

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i]
    if (dayMap.get(date)! > 0) {
      tempStreak++
      if (i === 0 || isConsecutive(sortedDates[i - 1], date)) {
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    } else {
      tempStreak = 0
    }
  }

  const lastEntryDate = sortedDates[sortedDates.length - 1]
  if (lastEntryDate && isRecentStreak(lastEntryDate, today)) {
    currentStreak = calculateCurrentStreak(sortedDates, dayMap)
  }

  const bestEntry = Array.from(dayMap.entries()).reduce(
    (max, [date, count]) => (count > (max?.count || 0) ? { date, count } : max),
    null as { date: string; count: number } | null
  )

  const daysActive = dayMap.size
  const averagePerDay = daysActive > 0 ? total / daysActive : 0

  const daysElapsed = Math.max(
    1,
    getDaysInYear(challenge.year) - getDaysLeftInYear(challenge.year)
  )
  const expectedByNow = (challenge.targetNumber / getDaysInYear(challenge.year)) * daysElapsed
  const paceOffset = total - expectedByNow

  let paceStatus: 'ahead' | 'onPace' | 'behind' = 'onPace'
  if (paceOffset > 5) paceStatus = 'ahead'
  else if (paceOffset < -5) paceStatus = 'behind'

  return {
    total,
    remaining,
    daysLeft,
    requiredPerDay,
    currentStreak,
    longestStreak,
    bestDay: bestEntry,
    averagePerDay,
    daysActive,
    paceStatus,
    paceOffset: Math.round(paceOffset),
  }
}

function isConsecutive(date1: string, date2: string): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
  return diff === 1
}

function isRecentStreak(lastDate: string, today: string): boolean {
  const last = new Date(lastDate)
  const now = new Date(today)
  const diff = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= 1
}

function calculateCurrentStreak(dates: string[], dayMap: Map<string, number>): number {
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let checkDate = new Date(today)

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (!dayMap.has(dateStr) || dayMap.get(dateStr)! === 0) break
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  return streak
}

export function generateHeatmapData(
  challenge: Challenge,
  entries: Entry[]
): HeatmapDay[] {
  const year = challenge.year
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)
  const heatmapDays: HeatmapDay[] = []

  const dayMap = new Map<string, number>()
  entries
    .filter((e) => e.challengeId === challenge.id)
    .forEach((entry) => {
      const existing = dayMap.get(entry.date) || 0
      dayMap.set(entry.date, existing + entry.count)
    })

  const maxCount = Math.max(...Array.from(dayMap.values()), 1)

  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const count = dayMap.get(dateStr) || 0
    const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCount) * 4))

    heatmapDays.push({ date: dateStr, count, level })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return heatmapDays
}

export function getPaceMessage(stats: ChallengeStats): string {
  const { paceStatus, paceOffset, requiredPerDay } = stats

  if (paceStatus === 'ahead') {
    return `You're ${Math.abs(paceOffset)} reps ahead of schedule 🔥`
  } else if (paceStatus === 'behind') {
    const extra = Math.ceil(Math.abs(paceOffset) / 7)
    return `Need ${extra} extra per day this week to catch up`
  } else {
    return `Perfectly on pace! Keep it up 💪`
  }
}

export function getHeatmapColor(level: number): string {
  const colors = [
    'oklch(0.25 0 0)',
    'oklch(0.65 0.12 145)',
    'oklch(0.68 0.15 145)',
    'oklch(0.72 0.18 145)',
    'oklch(0.75 0.21 145)',
  ]
  return colors[level] || colors[0]
}
