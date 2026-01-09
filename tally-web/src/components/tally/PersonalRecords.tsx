"use client";

import { Challenge, Entry } from '@/types'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Flame, Calendar, Award, Zap, Target } from 'lucide-react'
import { calculateStats } from '@/lib/stats'
import { format } from 'date-fns'

interface PersonalRecordsProps {
  challenges: Challenge[]
  entries: Entry[]
}

interface Record {
  icon: React.ElementType
  label: string
  value: string
  subtext: string
  color: string
  challengeName?: string
}

export function PersonalRecords({ challenges, entries }: PersonalRecordsProps) {
  if (challenges.length === 0 || entries.length === 0) return null

  const challengeIds = new Set(challenges.map(c => c.id))
  const relevantEntries = entries.filter(e => challengeIds.has(e.challengeId))

  let bestSingleDay = { date: '', count: 0, challengeName: '' }
  let longestStreak = { days: 0, challengeName: '' }
  let highestAverage = { average: 0, challengeName: '' }
  let mostConsistentDays = { days: 0, challengeName: '' }
  let biggestSingleEntry = { count: 0, date: '', challengeName: '' }
  let fastestToMilestone = { days: 0, challengeName: '', milestone: 0 }
  let maxRepsPerSet = { reps: 0, date: '', challengeName: '' }

  relevantEntries.forEach(entry => {
    if (entry.count > biggestSingleEntry.count) {
      const challenge = challenges.find(c => c.id === entry.challengeId)
      biggestSingleEntry = {
        count: entry.count,
        date: entry.date,
        challengeName: challenge?.name || ''
      }
    }

    if (entry.sets && entry.sets.length > 0) {
      entry.sets.forEach(set => {
        if (set.reps > maxRepsPerSet.reps) {
          const challenge = challenges.find(c => c.id === entry.challengeId)
          maxRepsPerSet = {
            reps: set.reps,
            date: entry.date,
            challengeName: challenge?.name || ''
          }
        }
      })
    }
  })

  challenges.forEach(challenge => {
    const stats = calculateStats(challenge, entries)
    
    if (stats.bestDay && stats.bestDay.count > bestSingleDay.count) {
      bestSingleDay = {
        date: stats.bestDay.date,
        count: stats.bestDay.count,
        challengeName: challenge.name
      }
    }

    if (stats.longestStreak > longestStreak.days) {
      longestStreak = {
        days: stats.longestStreak,
        challengeName: challenge.name
      }
    }

    if (stats.averagePerDay > highestAverage.average) {
      highestAverage = {
        average: Math.round(stats.averagePerDay),
        challengeName: challenge.name
      }
    }

    if (stats.daysActive > mostConsistentDays.days) {
      mostConsistentDays = {
        days: stats.daysActive,
        challengeName: challenge.name
      }
    }

    const challengeEntries = entries
      .filter(e => e.challengeId === challenge.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    if (challengeEntries.length > 0) {
      let runningTotal = 0
      let daysToFirstMilestone = 0
      const firstMilestone = Math.min(1000, Math.floor(challenge.targetNumber / 10))
      
      for (let i = 0; i < challengeEntries.length; i++) {
        runningTotal += challengeEntries[i].count
        daysToFirstMilestone++
        
        if (runningTotal >= firstMilestone) {
          if (fastestToMilestone.days === 0 || daysToFirstMilestone < fastestToMilestone.days) {
            fastestToMilestone = {
              days: daysToFirstMilestone,
              challengeName: challenge.name,
              milestone: firstMilestone
            }
          }
          break
        }
      }
    }
  })

  const records: Record[] = []

  if (bestSingleDay.count > 0) {
    records.push({
      icon: Trophy,
      label: 'Best Single Day',
      value: bestSingleDay.count.toLocaleString(),
      subtext: `${bestSingleDay.challengeName} • ${format(new Date(bestSingleDay.date), 'MMM d, yyyy')}`,
      color: 'oklch(0.65 0.24 60)'
    })
  }

  if (longestStreak.days > 0) {
    records.push({
      icon: Flame,
      label: 'Longest Streak',
      value: `${longestStreak.days} ${longestStreak.days === 1 ? 'day' : 'days'}`,
      subtext: longestStreak.challengeName,
      color: 'oklch(0.55 0.22 25)'
    })
  }

  if (highestAverage.average > 0) {
    records.push({
      icon: TrendingUp,
      label: 'Highest Daily Average',
      value: highestAverage.average.toLocaleString(),
      subtext: `${highestAverage.challengeName} per day`,
      color: 'oklch(0.45 0.18 145)'
    })
  }

  if (mostConsistentDays.days > 1) {
    records.push({
      icon: Calendar,
      label: 'Most Active Days',
      value: mostConsistentDays.days.toLocaleString(),
      subtext: mostConsistentDays.challengeName,
      color: 'oklch(0.5 0.2 260)'
    })
  }

  if (biggestSingleEntry.count > 0) {
    records.push({
      icon: Target,
      label: 'Biggest Single Entry',
      value: biggestSingleEntry.count.toLocaleString(),
      subtext: `${biggestSingleEntry.challengeName} • ${format(new Date(biggestSingleEntry.date), 'MMM d')}`,
      color: 'oklch(0.55 0.25 280)'
    })
  }

  if (fastestToMilestone.days > 0) {
    records.push({
      icon: Award,
      label: 'Fastest Milestone',
      value: `${fastestToMilestone.days} ${fastestToMilestone.days === 1 ? 'day' : 'days'}`,
      subtext: `${fastestToMilestone.milestone.toLocaleString()} ${fastestToMilestone.challengeName}`,
      color: 'oklch(0.6 0.22 40)'
    })
  }

  if (maxRepsPerSet.reps > 0) {
    records.push({
      icon: Zap,
      label: 'Max Reps in Single Set',
      value: maxRepsPerSet.reps.toLocaleString(),
      subtext: `${maxRepsPerSet.challengeName} • ${format(new Date(maxRepsPerSet.date), 'MMM d, yyyy')}`,
      color: 'oklch(0.58 0.26 30)'
    })
  }

  if (records.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Personal Records</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record, index) => {
          const Icon = record.icon
          return (
            <motion.div
              key={record.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-5 bg-card border-2 border-border hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${record.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: record.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                      {record.label}
                    </div>
                    <div 
                      className="text-2xl font-bold font-mono mb-1 leading-tight"
                      style={{ color: record.color }}
                    >
                      {record.value}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {record.subtext}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
