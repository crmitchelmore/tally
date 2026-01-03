import { Challenge, Entry } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FEELING_OPTIONS } from '@/lib/constants'
import { motion } from 'framer-motion'

interface SentimentAnalysisProps {
  challenge: Challenge
  entries: Entry[]
}

export function SentimentAnalysis({ challenge, entries }: SentimentAnalysisProps) {
  const challengeEntries = entries.filter((e) => e.challengeId === challenge.id && e.feeling)
  
  if (challengeEntries.length === 0) {
    return null
  }

  const feelingCounts = challengeEntries.reduce((acc, entry) => {
    if (entry.feeling) {
      acc[entry.feeling] = (acc[entry.feeling] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const totalWithFeeling = challengeEntries.length
  const maxCount = Math.max(...Object.values(feelingCounts))

  const recentEntries = [...challengeEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sentiment Over Time</CardTitle>
        <CardDescription>
          How your workouts have felt ({totalWithFeeling} entries tracked)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {FEELING_OPTIONS.map((option) => {
            const count = feelingCounts[option.type] || 0
            const percentage = totalWithFeeling > 0 ? (count / totalWithFeeling) * 100 : 0
            
            return (
              <div key={option.type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{option.emoji}</span>
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {count} {count === 1 ? 'time' : 'times'} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full bg-primary rounded-full"
                    style={{
                      opacity: maxCount > 0 ? 0.4 + (count / maxCount) * 0.6 : 0,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Recent Entries</h4>
          <div className="space-y-2">
            {recentEntries.map((entry) => {
              const feelingOption = FEELING_OPTIONS.find((o) => o.type === entry.feeling)
              if (!feelingOption) return null
              
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{feelingOption.emoji}</span>
                    <div>
                      <div className="font-medium">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.count} reps
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{feelingOption.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
