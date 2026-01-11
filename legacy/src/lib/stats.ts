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

export function getChallengeTimeframe(challenge: Challenge): { startDate: string; endDate: string; totalDays: number } {
  if (challenge.startDate && challenge.endDate) {
    const start = new Date(challenge.startDate)
    const end = new Date(challenge.endDate)
    const diffTime = end.getTime() - start.getTime()
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return { startDate: challenge.startDate, endDate: challenge.endDate, totalDays }
  }

  const year = challenge.year
  const yearStart = new Date(year, 0, 1).toISOString().split('T')[0]
  const yearEnd = new Date(year, 11, 31).toISOString().split('T')[0]
  return { startDate: yearStart, endDate: yearEnd, totalDays: getDaysInYear(year) }
}

export function getDaysLeftInTimeframe(challenge: Challenge): number {
  const { endDate } = getChallengeTimeframe(challenge)
  const now = new Date()
  const end = new Date(endDate + 'T23:59:59')
  if (now > end) return 0
  const diffTime = end.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function calculateStats(
  challenge: Challenge,
  entries: Entry[]
): ChallengeStats {
  const challengeEntries = entries.filter((e) => e.challengeId === challenge.id)
  const total = challengeEntries.reduce((sum, e) => sum + e.count, 0)
  const remaining = Math.max(0, challenge.targetNumber - total)
  const { totalDays } = getChallengeTimeframe(challenge)
  const daysLeft = getDaysLeftInTimeframe(challenge)
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

  const daysElapsed = Math.max(1, totalDays - daysLeft)
  const expectedByNow = (challenge.targetNumber / totalDays) * daysElapsed
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
  const { startDate, endDate } = getChallengeTimeframe(challenge)
  const start = new Date(startDate)
  const end = new Date(endDate)
  const heatmapDays: HeatmapDay[] = []

  const dayMap = new Map<string, number>()
  entries
    .filter((e) => e.challengeId === challenge.id)
    .forEach((entry) => {
      const existing = dayMap.get(entry.date) || 0
      dayMap.set(entry.date, existing + entry.count)
    })

  const maxCount = Math.max(...Array.from(dayMap.values()), 1)

  const currentDate = new Date(start)
  while (currentDate <= end) {
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
    'oklch(0.94 0.006 50)',
    'oklch(0.75 0.08 35)',
    'oklch(0.6 0.12 35)',
    'oklch(0.45 0.15 35)',
    'oklch(0.3 0.18 35)',
  ]
  return colors[level] || colors[0]
}
