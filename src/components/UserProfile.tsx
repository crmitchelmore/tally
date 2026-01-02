import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

interface UserInfo {
  avatarUrl: string
  email: string
  id: number
  isOwner: boolean
  login: string
}

export function UserProfile() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userInfo = await window.spark.user()
        setUser(userInfo)
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
      <Avatar>
        <AvatarImage src={user.avatarUrl} alt={user.login} />
        <AvatarFallback>{user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">@{user.login}</div>
        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
      </div>
    </div>
  )
}
