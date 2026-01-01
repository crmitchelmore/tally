import { HeatmapDay } from '@/types'
import { getHeatmapColor } from '@/lib/stats'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface HeatmapCalendarProps {
  data: HeatmapDay[]
  year: number
  size?: 'small' | 'large'
  onDayClick?: (day: HeatmapDay) => void
}

export function HeatmapCalendar({ data, year, size = 'small', onDayClick }: HeatmapCalendarProps) {
  const squareSize = size === 'small' ? 12 : 16
  const gap = size === 'small' ? 2 : 3

  const weeks: HeatmapDay[][] = []
  let currentWeek: HeatmapDay[] = []

  const firstDay = new Date(year, 0, 1).getDay()
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({ date: '', count: 0, level: 0 })
  }

  data.forEach((day, index) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', count: 0, level: 0 })
    }
    weeks.push(currentWeek)
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <TooltipProvider>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1">
          {size === 'large' && (
            <div className="flex gap-1 ml-8 text-xs text-muted-foreground">
              {months.map((month, i) => (
                <div key={month} style={{ width: squareSize * 4.3 }}>
                  {month}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-1">
            {size === 'large' && (
              <div className="flex flex-col justify-around text-xs text-muted-foreground pr-2">
                <div>Mon</div>
                <div>Wed</div>
                <div>Fri</div>
              </div>
            )}
            <div className="flex" style={{ gap }}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col" style={{ gap }}>
                  {week.map((day, dayIndex) => {
                    if (!day.date) {
                      return (
                        <div
                          key={dayIndex}
                          style={{
                            width: squareSize,
                            height: squareSize,
                          }}
                        />
                      )
                    }

                    const date = new Date(day.date)
                    const formattedDate = date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })

                    return (
                      <Tooltip key={day.date}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onDayClick?.(day)}
                            style={{
                              width: squareSize,
                              height: squareSize,
                              backgroundColor: getHeatmapColor(day.level),
                              border: '1px solid oklch(0.3 0 0)',
                            }}
                            className="rounded-sm hover:ring-2 hover:ring-primary/50 transition-all"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{formattedDate}</p>
                          <p className="text-sm">
                            {day.count > 0 ? `${day.count} reps` : 'No activity'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
