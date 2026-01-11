import { useState, useEffect } from 'react'
import { Challenge, Entry } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CircularProgress } from '@/components/CircularProgress'
import { UserMinus, TrendingUp, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface FollowedChallengeCardProps {
  challenge: Challenge
  entries: Entry[]
  onUnfollow: () => void
}

interface UserInfo {
  username: string
  avatarUrl: string
}

export function FollowedChallengeCard({ challenge, entries, onUnfollow }: FollowedChallengeCardProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({ username: 'User', avatarUrl: '' })
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      setIsLoadingUser(true)
      try {
        const user = await window.spark.user()
        if (user && user.id.toString() === challenge.userId) {
          setUserInfo({
            username: user.login || 'User',
            avatarUrl: user.avatarUrl || ''
          })
        } else {
          setUserInfo({
            username: `User ${challenge.userId.slice(0, 6)}`,
            avatarUrl: ''
          })
        }
      } catch (error) {
        setUserInfo({
          username: `User ${challenge.userId.slice(0, 6)}`,
          avatarUrl: ''
        })
      } finally {
        setIsLoadingUser(false)
      }
    }
    
    loadUser()
  }, [challenge.userId])

  const challengeEntries = entries.filter(e => e.challengeId === challenge.id)
  const totalReps = challengeEntries.reduce((sum, e) => sum + e.count, 0)
  const progress = (totalReps / challenge.targetNumber) * 100
  const progressPercent = Math.min(progress, 100)

  const getDaysRemaining = () => {
    if (challenge.endDate) {
      const now = new Date()
      const end = new Date(challenge.endDate)
      const diff = end.getTime() - now.getTime()
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }
    const now = new Date()
    const endOfYear = new Date(challenge.year, 11, 31)
    const diff = endOfYear.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const daysRemaining = getDaysRemaining()
  const totalDays = challenge.endDate 
    ? Math.ceil((new Date(challenge.endDate).getTime() - new Date(challenge.startDate || new Date()).getTime()) / (1000 * 60 * 60 * 24))
    : 365
  const daysElapsed = Math.max(1, totalDays - daysRemaining)
  const currentRate = totalReps / daysElapsed

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="overflow-hidden border-2 border-dashed">
        <div 
          className="h-2"
          style={{ backgroundColor: challenge.color }}
        />
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={userInfo.avatarUrl} alt={userInfo.username} />
                <AvatarFallback>{userInfo.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{userInfo.username}</p>
                <Badge variant="secondary" className="text-xs">Following</Badge>
              </div>
            </div>
            <Button
              onClick={onUnfollow}
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <UserMinus className="w-4 h-4" />
            </Button>
          </div>

          <h3 className="text-2xl font-bold mb-3">{challenge.name}</h3>
          
          <div className="flex items-center justify-center mb-4">
            <CircularProgress
              value={totalReps}
              max={challenge.targetNumber}
              size={140}
              strokeWidth={12}
              color={challenge.color}
            />
          </div>

          <div className="text-center mb-4">
            <p className="text-3xl font-bold geist-mono mb-1">
              {totalReps.toLocaleString()}
              <span className="text-muted-foreground text-xl"> / {challenge.targetNumber.toLocaleString()}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {progressPercent.toFixed(1)}% complete
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{daysRemaining} days left</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-semibold">{currentRate.toFixed(1)}/day</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
