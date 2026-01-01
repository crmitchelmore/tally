import { Challenge, Entry } from '@/types'
import { calculateStats, generateHeatmapData, getDaysInYear } from '@/lib/stats'
import { HeatmapCalendar } from './HeatmapCalendar'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft, Trophy, Flame, TrendingUp, Calendar } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChallengeDetailViewProps {
  challenge: Challenge
  entries: Entry[]
  onBack: () => void
}

export function ChallengeDetailView({ challenge, entries, onBack }: ChallengeDetailViewProps) {
  const stats = calculateStats(challenge, entries)
  const heatmapData = generateHeatmapData(challenge, entries)

  const challengeEntries = entries
    .filter((e) => e.challengeId === challenge.id)
    .sort((a, b) => a.date.localeCompare(b.date))

  const cumulativeData: { date: string; actual: number; target: number }[] = []
  let cumulative = 0
  const dailyTarget = challenge.targetNumber / getDaysInYear(challenge.year)

  const startDate = new Date(challenge.year, 0, 1)
  const today = new Date()
  const endDate = today.getFullYear() === challenge.year ? today : new Date(challenge.year, 11, 31)

  const entryMap = new Map<string, number>()
  challengeEntries.forEach((e) => {
    const existing = entryMap.get(e.date) || 0
    entryMap.set(e.date, existing + e.count)
  })

  const currentDate = new Date(startDate)
  let dayIndex = 0

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayCount = entryMap.get(dateStr) || 0
    cumulative += dayCount

    if (dayIndex % 7 === 0 || currentDate.getTime() === endDate.getTime()) {
      cumulativeData.push({
        date: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
        actual: cumulative,
        target: dailyTarget * (dayIndex + 1),
      })
    }

    currentDate.setDate(currentDate.getDate() + 1)
    dayIndex++
  }

  const weeklyData: { week: string; average: number }[] = []
  const weeks = Math.ceil(heatmapData.length / 7)

  for (let i = 0; i < weeks; i++) {
    const weekDays = heatmapData.slice(i * 7, (i + 1) * 7)
    const totalCount = weekDays.reduce((sum, day) => sum + day.count, 0)
    const average = totalCount / 7

    weeklyData.push({
      week: `W${i + 1}`,
      average: Math.round(average),
    })
  }

  const recentEntries = [...challengeEntries].reverse().slice(0, 10)

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{challenge.name}</h1>
            <p className="text-sm text-muted-foreground">
              {stats.total.toLocaleString()} / {challenge.targetNumber.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Best Day</span>
            </div>
            <div className="text-2xl font-bold geist-mono">
              {stats.bestDay?.count.toLocaleString() || 0}
            </div>
            {stats.bestDay && (
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(stats.bestDay.date).toLocaleDateString()}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Current Streak</span>
            </div>
            <div className="text-2xl font-bold geist-mono">{stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground mt-1">days</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Longest Streak</span>
            </div>
            <div className="text-2xl font-bold geist-mono">{stats.longestStreak}</div>
            <div className="text-xs text-muted-foreground mt-1">days</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Days Active</span>
            </div>
            <div className="text-2xl font-bold geist-mono">{stats.daysActive}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.daysActive / getDaysInYear(challenge.year)) * 100)}%
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Yearly Activity</h2>
          <HeatmapCalendar data={heatmapData} year={challenge.year} size="large" />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Cumulative Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
              <XAxis dataKey="date" stroke="oklch(0.55 0 0)" fontSize={12} />
              <YAxis stroke="oklch(0.55 0 0)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.2 0 0)',
                  border: '1px solid oklch(0.3 0 0)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="oklch(0.5 0 0)"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                name="Target"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke={challenge.color}
                strokeWidth={3}
                dot={false}
                name="Actual"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Weekly Average</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData.slice(-12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0 0)" />
              <XAxis dataKey="week" stroke="oklch(0.55 0 0)" fontSize={12} />
              <YAxis stroke="oklch(0.55 0 0)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.2 0 0)',
                  border: '1px solid oklch(0.3 0 0)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="average" fill={challenge.color} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {recentEntries.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Entries</h2>
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <div>
                    <div className="font-medium">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    {entry.note && (
                      <div className="text-sm text-muted-foreground">{entry.note}</div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-base font-bold geist-mono">
                    {entry.count}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
