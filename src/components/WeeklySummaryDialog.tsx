import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Challenge, Entry } from '@/types'
import { generateWeeklySummary, formatWeekRange } from '@/lib/weeklySummary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, TrendingUp, TrendingDown, Target, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface WeeklySummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenges: Challenge[]
  entries: Entry[]
}

export function WeeklySummaryDialog({
  open,
  onOpenChange,
  challenges,
  entries,
}: WeeklySummaryDialogProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  
  const summary = generateWeeklySummary(challenges, entries, weekOffset)
  const isCurrentWeek = weekOffset === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Summary
          </DialogTitle>
          <DialogDescription>
            Your progress overview for the week
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="text-center">
              <div className="font-semibold">
                {formatWeekRange(summary.weekStart, summary.weekEnd)}
              </div>
              {isCurrentWeek && (
                <div className="text-xs text-muted-foreground">Current Week</div>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
              disabled={isCurrentWeek}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Reps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold geist-mono">
                  {summary.totalReps.toLocaleString()}
                </div>
                {summary.comparisonToPreviousWeek !== 0 && (
                  <div className={`flex items-center gap-1 text-sm mt-1 ${
                    summary.comparisonToPreviousWeek > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary.comparisonToPreviousWeek > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(summary.comparisonToPreviousWeek).toFixed(0)}% vs last week
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Daily Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold geist-mono">
                  {Math.round(summary.averagePerDay)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  reps per day
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Entries Logged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold geist-mono">
                  {summary.entriesLogged}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {summary.entriesLogged === 1 ? 'entry' : 'entries'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold geist-mono">
                  {summary.challengesActive}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {summary.challengesActive === 1 ? 'challenge' : 'challenges'}
                </div>
              </CardContent>
            </Card>
          </div>

          {summary.bestDay && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="w-4 h-4 text-accent" />
                  Best Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold geist-mono">
                    {summary.bestDay.count.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    on {format(new Date(summary.bestDay.date), 'EEEE, MMM d')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {summary.challengeBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Challenge Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.challengeBreakdown.map((cb, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cb.color }}
                      />
                      <span className="text-sm">{cb.challengeName}</span>
                    </div>
                    <span className="font-semibold geist-mono">
                      {cb.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.dayBreakdown.map((day, idx) => {
                  const dayDate = new Date(day.date)
                  const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  const maxCount = Math.max(...summary.dayBreakdown.map(d => d.count))
                  const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                  
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`text-sm w-20 ${isToday ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {format(dayDate, 'EEE dd')}
                      </div>
                      <div className="flex-1 h-6 bg-secondary rounded-md overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-sm font-semibold geist-mono w-16 text-right">
                        {day.count.toLocaleString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
