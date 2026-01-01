import { motion } from 'framer-motion'
import { Challenge } from '@/types'
import { calculateStats, generateHeatmapData, getPaceMessage } from '@/lib/stats'
import { CircularProgress } from './CircularProgress'
import { HeatmapCalendar } from './HeatmapCalendar'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { TrendingUp, TrendingDown, Target, Flame } from 'lucide-react'
import { Entry } from '@/types'

interface ChallengeCardProps {
  challenge: Challenge
  entries: Entry[]
  onClick: () => void
}

export function ChallengeCard({ challenge, entries, onClick }: ChallengeCardProps) {
  const stats = calculateStats(challenge, entries)
  const heatmapData = generateHeatmapData(challenge, entries)
  const paceMessage = getPaceMessage(stats)

  const paceColor =
    stats.paceStatus === 'ahead'
      ? 'oklch(0.7 0.2 145)'
      : stats.paceStatus === 'behind'
        ? 'oklch(0.65 0.25 25)'
        : 'oklch(0.8 0.15 90)'

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={onClick}
        className="p-6 cursor-pointer bg-card/80 backdrop-blur-xl border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden"
      >
        <div 
          className="absolute top-0 left-0 right-0 h-1" 
          style={{ backgroundColor: challenge.color }}
        />
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-semibold mb-1">{challenge.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {challenge.year}
              </Badge>
              {stats.currentStreak > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs flex items-center gap-1"
                  style={{
                    borderColor: 'oklch(0.7 0.2 50)',
                    color: 'oklch(0.7 0.2 50)',
                  }}
                >
                  <Flame className="w-3 h-3" />
                  {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          <CircularProgress
            value={stats.total}
            max={challenge.targetNumber}
            size={100}
            strokeWidth={10}
            color={challenge.color}
          />
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold geist-mono" style={{ color: challenge.color }}>
              {stats.total.toLocaleString()}
            </span>
            <span className="text-xl text-muted-foreground">
              / {challenge.targetNumber.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mb-4 p-4 rounded-lg bg-secondary/30 border border-border/30">
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Remaining</div>
              <div className="text-lg font-bold geist-mono">
                {stats.remaining.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Days left</div>
              <div className="text-lg font-bold geist-mono">{stats.daysLeft}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Per day</div>
              <div
                className="text-lg font-bold geist-mono"
                style={{ color: paceColor }}
              >
                {stats.requiredPerDay}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: paceColor }}>
            {stats.paceStatus === 'ahead' ? (
              <TrendingUp className="w-4 h-4" />
            ) : stats.paceStatus === 'behind' ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            <span className="font-medium">{paceMessage}</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Activity</div>
          <HeatmapCalendar data={heatmapData} year={challenge.year} size="small" />
        </div>
      </Card>
    </motion.div>
  )
}
