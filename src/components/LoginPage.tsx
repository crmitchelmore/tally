import { Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface LoginPageProps {
  onRetry: () => void
  isLoading?: boolean
}

export function LoginPage({ onRetry, isLoading = false }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-background tally-marks-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
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

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome to Tally</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Sign in with your GitHub account to start tracking your challenges and progress.
          </p>
          
          <div className="flex flex-col gap-2 text-xs text-muted-foreground text-left">
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

        {isLoading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Connecting to GitHub...</span>
            </div>
          </div>
        ) : (
          <Button
            onClick={onRetry}
            size="lg"
            className="shadow-lg w-full"
          >
            Sign in with GitHub
          </Button>
        )}

        <p className="text-xs text-muted-foreground mt-6">
          By signing in, you agree to use this app for personal progress tracking
        </p>
      </motion.div>
    </div>
  )
}
