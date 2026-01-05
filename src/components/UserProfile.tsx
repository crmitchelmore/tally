import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserInfo {
  avatarUrl: string
  email: string
  id: number
  isOwner: boolean
  login: string
}

interface UserProfileProps {
  onLogout?: () => void
  userId: string
}

export function UserProfile({ onLogout, userId }: UserProfileProps) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEmailUser, setIsEmailUser] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (userId.startsWith('email-')) {
          setIsEmailUser(true)
          const emailUsersData = await window.spark.kv.get<Record<string, { password: string }>>('email-users') || {}
          const foundEmail = Object.keys(emailUsersData).find(email => {
            const encodedEmail = `email-${btoa(email).replace(/[^a-zA-Z0-9]/g, '')}`
            return encodedEmail === userId
          })
          setUserEmail(foundEmail || 'user@email.com')
        } else {
          const userInfo = await window.spark.user()
          setUser(userInfo)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    )
  }

  if (isEmailUser) {
    const initials = userEmail.substring(0, 2).toUpperCase()
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto p-2 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{userEmail}</div>
                <div className="text-xs text-muted-foreground font-normal">Email Account</div>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
            <LogOut className="w-4 h-4 mr-2" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-2 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatarUrl} alt={user.login} />
            <AvatarFallback>{user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatarUrl} alt={user.login} />
              <AvatarFallback>{user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">@{user.login}</div>
              <div className="text-xs text-muted-foreground truncate font-normal">{user.email}</div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="cursor-default">
          <User className="w-4 h-4 mr-2" />
          <span className="text-xs">ID: {user.id}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
