import { Challenge, Entry } from '@/types'
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval } from 'date-fns'

export interface WeeklySummary {
  weekStart: string
  weekEnd: string
  totalReps: number
  entriesLogged: number
  challengesActive: number
  bestDay: { date: string; count: number } | null
  dayBreakdown: { date: string; count: number }[]
  challengeBreakdown: { challengeName: string; count: number; color: string }[]
  averagePerDay: number
  comparisonToPreviousWeek: number
}

export const generateWeeklySummary = (
  challenges: Challenge[],
  entries: Entry[],
  weekOffset: number = 0
): WeeklySummary => {
  const today = new Date()
  const targetWeekStart = startOfWeek(subWeeks(today, weekOffset), { weekStartsOn: 1 })
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 })
  
  const weekDays = eachDayOfInterval({ start: targetWeekStart, end: targetWeekEnd })
  const weekDateStrings = weekDays.map(d => format(d, 'yyyy-MM-dd'))
  
  const weekEntries = entries.filter(e => weekDateStrings.includes(e.date))
  
  const totalReps = weekEntries.reduce((sum, e) => sum + e.count, 0)
  const entriesLogged = weekEntries.length
  
  const activeChallengeIds = new Set(weekEntries.map(e => e.challengeId))
  const challengesActive = activeChallengeIds.size
  
  const dayBreakdown = weekDateStrings.map(date => {
    const dayEntries = weekEntries.filter(e => e.date === date)
    const count = dayEntries.reduce((sum, e) => sum + e.count, 0)
    return { date, count }
  })
  
  const bestDay = dayBreakdown.reduce<{ date: string; count: number } | null>(
    (best, current) => {
      if (current.count === 0) return best
      if (!best || current.count > best.count) return current
      return best
    },
    null
  )
  
  const challengeMap = new Map<string, { challengeName: string; count: number; color: string }>()
  
  weekEntries.forEach(entry => {
    const challenge = challenges.find(c => c.id === entry.challengeId)
    if (!challenge) return
    
    const existing = challengeMap.get(entry.challengeId)
    if (existing) {
      existing.count += entry.count
    } else {
      challengeMap.set(entry.challengeId, {
        challengeName: challenge.name,
        count: entry.count,
        color: challenge.color,
      })
    }
  })
  
  const challengeBreakdown = Array.from(challengeMap.values()).sort((a, b) => b.count - a.count)
  
  const averagePerDay = totalReps / 7
  
  const previousWeekStart = startOfWeek(subWeeks(today, weekOffset + 1), { weekStartsOn: 1 })
  const previousWeekEnd = endOfWeek(previousWeekStart, { weekStartsOn: 1 })
  const previousWeekDays = eachDayOfInterval({ start: previousWeekStart, end: previousWeekEnd })
  const previousWeekDateStrings = previousWeekDays.map(d => format(d, 'yyyy-MM-dd'))
  const previousWeekEntries = entries.filter(e => previousWeekDateStrings.includes(e.date))
  const previousWeekTotal = previousWeekEntries.reduce((sum, e) => sum + e.count, 0)
  
  const comparisonToPreviousWeek = previousWeekTotal > 0 
    ? ((totalReps - previousWeekTotal) / previousWeekTotal) * 100 
    : 0
  
  return {
    weekStart: format(targetWeekStart, 'yyyy-MM-dd'),
    weekEnd: format(targetWeekEnd, 'yyyy-MM-dd'),
    totalReps,
    entriesLogged,
    challengesActive,
    bestDay,
    dayBreakdown,
    challengeBreakdown,
    averagePerDay,
    comparisonToPreviousWeek,
  }
}

export const formatWeekRange = (weekStart: string, weekEnd: string): string => {
  const start = new Date(weekStart)
  const end = new Date(weekEnd)
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
}
