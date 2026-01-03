import { useState } from 'react'
import { Challenge, Entry, HeatmapDay, Set, FeelingType } from '@/types'
import { calculateStats, generateHeatmapData, getDaysInYear } from '@/lib/stats'
import { FEELING_OPTIONS } from '@/lib/constants'
import { HeatmapCalendar } from './HeatmapCalendar'
import { EditEntryDialog } from './EditEntryDialog'
import { DayEntriesDialog } from './DayEntriesDialog'
import { AddEntryDetailSheet } from './AddEntryDetailSheet'
import { SetsRepsAnalysis } from './SetsRepsAnalysis'
import { SentimentAnalysis } from './SentimentAnalysis'
import { ChallengeSettingsDialog } from './ChallengeSettingsDialog'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { ArrowLeft, Trophy, Flame, TrendingUp, Calendar, Pencil, Plus, Settings } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChallengeDetailViewProps {
  challenge: Challenge
  entries: Entry[]
  onBack: () => void
  onAddEntry: (challengeId: string, count: number, note: string, date: string, sets?: Set[], feeling?: FeelingType) => void
  onUpdateEntry: (entryId: string, count: number, note: string, date: string, feeling?: FeelingType) => void
  onDeleteEntry: (entryId: string) => void
  onUpdateChallenge?: (challengeId: string, updates: Partial<Challenge>) => void
  onArchiveChallenge?: (challengeId: string) => void
}

export function ChallengeDetailView({ challenge, entries, onBack, onAddEntry, onUpdateEntry, onDeleteEntry, onUpdateChallenge, onArchiveChallenge }: ChallengeDetailViewProps) {
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayEntriesDialogOpen, setDayEntriesDialogOpen] = useState(false)
  const [addEntryOpen, setAddEntryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
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

  const handleEditClick = (entry: Entry) => {
    setEditingEntry(entry)
    setEditDialogOpen(true)
  }

  const handleDayClick = (day: HeatmapDay) => {
    if (day.count > 0) {
      setSelectedDate(day.date)
      setDayEntriesDialogOpen(true)
    }
  }

  const dayEntries = selectedDate
    ? entries.filter((e) => e.challengeId === challenge.id && e.date === selectedDate)
    : []

  return (
    <div className="min-h-screen bg-background pb-20 tally-marks-bg">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b-2 border-border z-10 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{challenge.name}</h1>
            <p className="text-sm text-muted-foreground">
              {stats.total.toLocaleString()} / {challenge.targetNumber.toLocaleString()}
            </p>
          </div>
          {onUpdateChallenge && onArchiveChallenge && (
            <Button onClick={() => setSettingsOpen(true)} size="lg" variant="outline" className="shadow-lg">
              <Settings className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Settings</span>
            </Button>
          )}
          <Button onClick={() => setAddEntryOpen(true)} size="lg" className="shadow-lg">
            <Plus className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Add Entry</span>
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-2 border-border">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4" style={{ color: challenge.color }} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Best Day</span>
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

          <Card className="p-4 border-2 border-border">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4" style={{ color: 'oklch(0.55 0.22 25)' }} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Streak</span>
            </div>
            <div className="text-2xl font-bold geist-mono">{stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground mt-1">days</div>
          </Card>

          <Card className="p-4 border-2 border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.25 0.02 30)' }} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Longest Streak</span>
            </div>
            <div className="text-2xl font-bold geist-mono">{stats.longestStreak}</div>
            <div className="text-xs text-muted-foreground mt-1">days</div>
          </Card>

          <Card className="p-4 border-2 border-border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" style={{ color: 'oklch(0.25 0.02 30)' }} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Days Active</span>
            </div>
            <div className="text-2xl font-bold geist-mono">{stats.daysActive}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.daysActive / getDaysInYear(challenge.year)) * 100)}%
            </div>
          </Card>
        </div>

        <Card className="p-6 border-2 border-border">
          <h2 className="text-lg font-semibold mb-4 uppercase tracking-wider text-sm text-muted-foreground">Yearly Activity</h2>
          <HeatmapCalendar
            data={heatmapData}
            year={challenge.year}
            size="large"
            onDayClick={handleDayClick}
          />
        </Card>

        <Card className="p-6 border-2 border-border">
          <h2 className="text-lg font-semibold mb-4 uppercase tracking-wider text-sm text-muted-foreground">Cumulative Progress</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.01 50)" />
              <XAxis dataKey="date" stroke="oklch(0.5 0.01 30)" fontSize={12} />
              <YAxis stroke="oklch(0.5 0.01 30)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.99 0.002 50)',
                  border: '2px solid oklch(0.85 0.01 50)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="oklch(0.7 0.01 30)"
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

        <Card className="p-6 border-2 border-border">
          <h2 className="text-lg font-semibold mb-4 uppercase tracking-wider text-sm text-muted-foreground">Weekly Average</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData.slice(-12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.01 50)" />
              <XAxis dataKey="week" stroke="oklch(0.5 0.01 30)" fontSize={12} />
              <YAxis stroke="oklch(0.5 0.01 30)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.99 0.002 50)',
                  border: '2px solid oklch(0.85 0.01 50)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="average" fill={challenge.color} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <SetsRepsAnalysis entries={challengeEntries} color={challenge.color} />

        <SentimentAnalysis challenge={challenge} entries={entries} />

        {recentEntries.length > 0 && (
          <Card className="p-6 border-2 border-border">
            <h2 className="text-lg font-semibold mb-4 uppercase tracking-wider text-sm text-muted-foreground">Recent Entries</h2>
            <div className="space-y-3">
              {recentEntries.map((entry) => {
                const feelingOption = entry.feeling ? FEELING_OPTIONS.find((o) => o.type === entry.feeling) : null
                
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50 group hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        {feelingOption && (
                          <span className="text-lg" title={feelingOption.description}>
                            {feelingOption.emoji}
                          </span>
                        )}
                      </div>
                      {entry.sets && entry.sets.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {entry.sets.length} sets: {entry.sets.map(s => s.reps).join(', ')} reps
                        </div>
                      )}
                      {entry.note && (
                        <div className="text-sm text-muted-foreground mt-1">{entry.note}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-base font-bold geist-mono">
                        {entry.count}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEditClick(entry)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      <AddEntryDetailSheet
        open={addEntryOpen}
        onOpenChange={setAddEntryOpen}
        challenge={challenge}
        onAddEntry={onAddEntry}
      />

      <EditEntryDialog
        entry={editingEntry}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdateEntry={onUpdateEntry}
        onDeleteEntry={onDeleteEntry}
      />

      <DayEntriesDialog
        date={selectedDate || ''}
        entries={dayEntries}
        open={dayEntriesDialogOpen}
        onOpenChange={setDayEntriesDialogOpen}
        onEditEntry={handleEditClick}
      />

      {onUpdateChallenge && onArchiveChallenge && (
        <ChallengeSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          challenge={challenge}
          onUpdateChallenge={onUpdateChallenge}
          onArchiveChallenge={onArchiveChallenge}
        />
      )}
    </div>
  )
}
