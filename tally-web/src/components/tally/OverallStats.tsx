"use client";

import { Challenge, Entry } from '@/types'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { TrendingUp, Flame, Target, Calendar } from 'lucide-react'
import { calculateStats } from '@/lib/stats'

interface OverallStatsProps {
  challenges: Challenge[]
  entries: Entry[]
}

export function OverallStats({ challenges, entries }: OverallStatsProps) {
  if (challenges.length === 0) return null

  const challengeIds = new Set(challenges.map(c => c.id))
  const relevantEntries = entries.filter(e => challengeIds.has(e.challengeId))
  
  const totalRepsAllTime = relevantEntries.reduce((sum, e) => sum + e.count, 0)
  
  const today = new Date().toISOString().split('T')[0]
  const entriesToday = relevantEntries.filter(e => e.date === today)
  const repsToday = entriesToday.reduce((sum, e) => sum + e.count, 0)
  
  let totalCurrentStreak = 0
  let challengesAheadOfPace = 0
  
  challenges.forEach(challenge => {
    const stats = calculateStats(challenge, entries)
    totalCurrentStreak = Math.max(totalCurrentStreak, stats.currentStreak)
    if (stats.paceStatus === 'ahead') challengesAheadOfPace++
  })

  const stats = [
    {
      icon: TrendingUp,
      label: 'Total Marks',
      value: totalRepsAllTime.toLocaleString(),
      color: 'oklch(0.25 0.02 30)',
      subtext: 'all time'
    },
    {
      icon: Calendar,
      label: 'Today',
      value: repsToday.toLocaleString(),
      color: 'oklch(0.3 0.025 35)',
      subtext: `${entriesToday.length} ${entriesToday.length === 1 ? 'entry' : 'entries'}`
    },
    {
      icon: Flame,
      label: 'Best Streak',
      value: totalCurrentStreak.toString(),
      color: 'oklch(0.55 0.22 25)',
      subtext: 'days'
    },
    {
      icon: Target,
      label: 'Ahead of Pace',
      value: challengesAheadOfPace.toString(),
      color: 'oklch(0.45 0.18 145)',
      subtext: `of ${challenges.length} ${challenges.length === 1 ? 'challenge' : 'challenges'}`
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-4 bg-card border-2 border-border">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="text-3xl font-bold font-mono mb-1" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.subtext}</div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
