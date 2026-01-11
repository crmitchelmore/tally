import { useState } from 'react'
import { Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface LoginPageProps {
  onEmailLogin: (email: string, password: string) => Promise<void>
  onEmailRegister: (email: string, password: string) => Promise<void>
  onGitHubLogin: () => void
  isLoading?: boolean
}

export function LoginPage({ onEmailLogin, onEmailRegister, onGitHubLogin, isLoading = false }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Missing fields', {
        description: 'Please enter both email and password',
      })
      return
    }

    if (password.length < 6) {
      toast.error('Password too short', {
        description: 'Password must be at least 6 characters',
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await onEmailLogin(email, password)
      } else {
        await onEmailRegister(email, password)
      }
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background tally-marks-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        <motion.div
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto"
          animate={isLoading ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Target className="w-12 h-12 text-primary" />
        </motion.div>

        <h1 className="text-5xl font-bold tracking-tight mb-3 flex items-center justify-center gap-3">
          <span className="text-foreground">Tally</span>
          <svg width="40" height="50" viewBox="0 0 40 50" className="inline-block">
            <line x1="10" y1="5" x2="10" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="17" y1="5" x2="17" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="24" y1="5" x2="24" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="31" y1="5" x2="31" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="5" y1="20" x2="35" y2="30" stroke="oklch(0.55 0.22 25)" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </h1>
        
        <p className="text-muted-foreground text-lg mb-8">
          Count what matters. Mark your progress.
        </p>

        <div className="bg-card border border-border rounded-lg p-6 mb-6 text-left">
          <h2 className="text-xl font-semibold mb-2 text-center">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-muted-foreground text-sm mb-6 text-center">
            {mode === 'login' 
              ? 'Sign in to continue tracking your progress' 
              : 'Start your journey to crush your goals'}
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || isLoading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting || isLoading}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full shadow-lg"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isSubmitting || isLoading}
            >
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span className="text-primary font-semibold">
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </span>
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Connecting to GitHub...</span>
              </div>
            </div>
          ) : (
            <Button
              onClick={onGitHubLogin}
              size="lg"
              variant="outline"
              className="w-full shadow-lg"
              disabled={isSubmitting}
            >
              Sign in with GitHub
            </Button>
          )}
          
          <div className="flex flex-col gap-2 text-xs text-muted-foreground mt-6">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
              <span>Your data is private and only visible to you</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
              <span>All challenges and entries are scoped to your account</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
              <span>Export and backup your data anytime</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          By signing in, you agree to use this app for personal progress tracking
        </p>
      </motion.div>
    </div>
  )
}
