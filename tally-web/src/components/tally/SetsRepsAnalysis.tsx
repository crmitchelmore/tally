"use client";

import { Entry } from '@/types'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'

interface SetsRepsAnalysisProps {
  entries: Entry[]
  color: string
}

export function SetsRepsAnalysis({ entries, color }: SetsRepsAnalysisProps) {
  const entriesWithSets = entries.filter(e => e.sets && e.sets.length > 0)

  if (entriesWithSets.length === 0) {
    return null
  }

  const averageRepsData = entriesWithSets.map(entry => {
    const totalReps = entry.sets!.reduce((sum, set) => sum + set.reps, 0)
    const avgReps = totalReps / entry.sets!.length
    
    return {
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: entry.date,
      avgReps: Math.round(avgReps * 10) / 10,
      sets: entry.sets!.length,
      totalReps,
    }
  }).sort((a, b) => a.fullDate.localeCompare(b.fullDate))

  const allSetsData: { date: string; setNumber: number; reps: number }[] = []
  entriesWithSets.forEach(entry => {
    const dateLabel = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    entry.sets!.forEach((set, index) => {
      allSetsData.push({
        date: dateLabel,
        setNumber: index + 1,
        reps: set.reps,
      })
    })
  })

  const setStats = entriesWithSets.flatMap(e => e.sets!.map(s => s.reps))
  const avgRepsPerSet = setStats.reduce((sum, reps) => sum + reps, 0) / setStats.length
  const maxReps = Math.max(...setStats)

  const totalSets = entriesWithSets.reduce((sum, e) => sum + (e.sets?.length || 0), 0)

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2 border-border">
        <h2 className="text-lg font-semibold mb-4 uppercase tracking-wider text-sm text-muted-foreground">
          Sets & Reps Analysis
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-secondary/50 rounded-lg border-2 border-border">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Avg Reps/Set</div>
            <div className="text-3xl font-bold font-mono" style={{ color }}>{Math.round(avgRepsPerSet)}</div>
          </div>
          <div className="text-center p-4 bg-accent/10 rounded-lg border-2 border-accent/30">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Max Reps</div>
            <div className="text-3xl font-bold font-mono" style={{ color }}>{maxReps}</div>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg border-2 border-border">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Sets</div>
            <div className="text-3xl font-bold font-mono">{totalSets}</div>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg border-2 border-border">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Sessions</div>
            <div className="text-3xl font-bold font-mono">{entriesWithSets.length}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Average Reps Per Set Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={averageRepsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.01 50)" />
              <XAxis 
                dataKey="date" 
                stroke="oklch(0.5 0.01 30)" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="oklch(0.5 0.01 30)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.99 0.002 50)',
                  border: '2px solid oklch(0.85 0.01 50)',
                  borderRadius: '8px',
                }}
                formatter={(value) =>
                  value == null
                    ? (['—', 'Avg per Set'] as const)
                    : ([`${value} reps`, 'Avg per Set'] as const)
                }
              />
              <Line
                type="monotone"
                dataKey="avgReps"
                stroke={color}
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 5 }}
                name="Avg Reps"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">All Sets Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.01 50)" />
              <XAxis 
                dataKey="date" 
                stroke="oklch(0.5 0.01 30)" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="oklch(0.5 0.01 30)" 
                fontSize={12}
                label={{ value: 'Reps', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.99 0.002 50)',
                  border: '2px solid oklch(0.85 0.01 50)',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value} reps`]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Scatter 
                data={allSetsData} 
                fill={color}
                opacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 border-2 border-border">
        <h2 className="text-lg font-semibold mb-4 uppercase tracking-wider text-sm text-muted-foreground">
          Session Details
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {entriesWithSets.map(entry => (
            <div key={entry.id} className="p-4 bg-secondary/30 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {entry.sets!.length} sets × {Math.round(entry.sets!.reduce((sum, s) => sum + s.reps, 0) / entry.sets!.length)} avg reps
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.sets!.map((set, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-background rounded-md text-sm font-semibold font-mono"
                    style={{ borderLeft: `3px solid ${color}` }}
                  >
                    {set.reps}
                  </div>
                ))}
              </div>
              {entry.note && (
                <div className="mt-2 text-sm text-muted-foreground italic">
                  {entry.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
