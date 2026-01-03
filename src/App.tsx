import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Challenge, Entry, Set, FeelingType } from '@/types'
import { ChallengeCard } from '@/components/ChallengeCard'
import { AddEntrySheet } from '@/components/AddEntrySheet'
import { CreateChallengeDialog } from '@/components/CreateChallengeDialog'
import { ChallengeDetailView } from '@/components/ChallengeDetailView'
import { OverallStats } from '@/components/OverallStats'
import { PersonalRecords } from '@/components/PersonalRecords'
import { ExportImportDialog } from '@/components/ExportImportDialog'
import { WeeklySummaryDialog } from '@/components/WeeklySummaryDialog'
import { UserProfile } from '@/components/UserProfile'
import { LoginPage } from '@/components/LoginPage'
import { LeaderboardView } from '@/components/LeaderboardView'
import { PublicChallengesView } from '@/components/PublicChallengesView'
import { Button } from '@/components/ui/button'
import { Plus, Target, Calendar, Database, Trophy, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

type ViewMode = 'dashboard' | 'leaderboard' | 'public-challenges'

function App() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [allChallenges, setAllChallenges] = useKV<Challenge[]>('user-challenges', [])
  const [allEntries, setAllEntries] = useKV<Entry[]>('user-entries', [])
  const [addEntryOpen, setAddEntryOpen] = useState(false)
  const [createChallengeOpen, setCreateChallengeOpen] = useState(false)
  const [exportImportOpen, setExportImportOpen] = useState(false)
  const [weeklySummaryOpen, setWeeklySummaryOpen] = useState(false)
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await window.spark.user()
        if (user && user.id) {
          setUserId(user.id.toString())
        } else {
          setUserId(null)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        setUserId(null)
      } finally {
        setIsLoadingUser(false)
      }
    }
    fetchUser()
  }, [])

  const handleRetryAuth = async () => {
    setIsLoadingUser(true)
    try {
      const user = await window.spark.user()
      if (user && user.id) {
        setUserId(user.id.toString())
        toast.success('Signed in successfully!', {
          description: `Welcome, ${user.login || 'User'}!`,
        })
      } else {
        setUserId(null)
        toast.error('Authentication failed', {
          description: 'Unable to verify your GitHub account',
        })
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUserId(null)
      toast.error('Authentication failed', {
        description: 'Please try again or refresh the page',
      })
    } finally {
      setIsLoadingUser(false)
    }
  }

  const challenges = (allChallenges || []).filter(c => c.userId === userId)
  const entries = (allEntries || []).filter(e => e.userId === userId)

  const currentYear = new Date().getFullYear()
  const activeChallenges = challenges.filter(
    (c) => !c.archived && c.year >= currentYear
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleCreateChallenge = (
    challengeData: Omit<Challenge, 'id' | 'createdAt' | 'userId'>
  ) => {
    if (!userId) {
      toast.error('Not authenticated', {
        description: 'Please refresh the page to authenticate',
      })
      return
    }

    const newChallenge: Challenge = {
      ...challengeData,
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      createdAt: new Date().toISOString(),
    }

    setAllChallenges((current) => [...(current || []), newChallenge])
    toast.success('Challenge created! 🎯', {
      description: `Ready to crush ${newChallenge.targetNumber.toLocaleString()} ${newChallenge.name}!`,
    })
  }

  const handleAddEntry = (
    challengeId: string,
    count: number,
    note: string,
    date: string,
    sets?: Set[],
    feeling?: FeelingType
  ) => {
    if (!userId) {
      toast.error('Not authenticated', {
        description: 'Please refresh the page to authenticate',
      })
      return
    }

    const newEntry: Entry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      challengeId,
      date,
      count,
      note: note || undefined,
      sets: sets || undefined,
      feeling: feeling || undefined,
    }

    setAllEntries((current) => [...(current || []), newEntry])
    
    const challenge = challenges.find((c) => c.id === challengeId)
    if (sets && sets.length > 0) {
      toast.success('Entry logged! 🔥', {
        description: `Added ${sets.length} sets (${count} total reps) to ${challenge?.name}`,
      })
    } else {
      toast.success('Entry logged! 🔥', {
        description: `Added ${count} to ${challenge?.name}`,
      })
    }
  }

  const handleUpdateEntry = (
    entryId: string,
    count: number,
    note: string,
    date: string,
    feeling?: FeelingType
  ) => {
    setAllEntries((current) =>
      (current || []).map((entry) =>
        entry.id === entryId && entry.userId === userId
          ? { ...entry, count, note: note || undefined, date, feeling: feeling || undefined }
          : entry
      )
    )
    toast.success('Entry updated! ✏️', {
      description: 'Your changes have been saved',
    })
  }

  const handleDeleteEntry = (entryId: string) => {
    setAllEntries((current) => (current || []).filter((entry) => entry.id !== entryId || entry.userId !== userId))
    toast.success('Entry deleted', {
      description: 'The entry has been removed',
    })
  }

  const handleImportData = (importedChallenges: Challenge[], importedEntries: Entry[]) => {
    if (!userId) {
      toast.error('Not authenticated', {
        description: 'Please refresh the page to authenticate',
      })
      return
    }

    const challengesWithUserId = importedChallenges.map(c => ({ ...c, userId }))
    const entriesWithUserId = importedEntries.map(e => ({ ...e, userId }))

    setAllChallenges((current) => {
      const otherUsersChallenges = (current || []).filter(c => c.userId !== userId)
      return [...otherUsersChallenges, ...challengesWithUserId]
    })
    
    setAllEntries((current) => {
      const otherUsersEntries = (current || []).filter(e => e.userId !== userId)
      return [...otherUsersEntries, ...entriesWithUserId]
    })
  }

  const handleClearAllData = () => {
    if (!userId) return

    setAllChallenges((current) => (current || []).filter(c => c.userId !== userId))
    setAllEntries((current) => (current || []).filter(e => e.userId !== userId))
    toast.success('All data cleared', {
      description: 'Your challenges and entries have been deleted',
    })
  }

  const handleUpdateChallenge = (challengeId: string, updates: Partial<Challenge>) => {
    setAllChallenges((current) =>
      (current || []).map((challenge) =>
        challenge.id === challengeId && challenge.userId === userId
          ? { ...challenge, ...updates }
          : challenge
      )
    )
    
    if (updates.isPublic !== undefined) {
      toast.success(updates.isPublic ? 'Challenge is now public! 🌍' : 'Challenge is now private 🔒', {
        description: updates.isPublic 
          ? 'Others can now see your progress on leaderboards' 
          : 'Only you can see this challenge',
      })
    }
  }

  const handleArchiveChallenge = (challengeId: string) => {
    setAllChallenges((current) =>
      (current || []).map((challenge) =>
        challenge.id === challengeId && challenge.userId === userId
          ? { ...challenge, archived: true }
          : challenge
      )
    )
    toast.success('Challenge archived', {
      description: 'The challenge has been moved to your archives',
    })
  }

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId)

  if (isLoadingUser) {
    return (
      <>
        <LoginPage onRetry={handleRetryAuth} isLoading={true} />
        <Toaster />
      </>
    )
  }

  if (!userId) {
    return (
      <>
        <LoginPage onRetry={handleRetryAuth} isLoading={false} />
        <Toaster />
      </>
    )
  }

  if (selectedChallenge) {
    return (
      <>
        <ChallengeDetailView
          challenge={selectedChallenge}
          entries={entries}
          onBack={() => setSelectedChallengeId(null)}
          onAddEntry={handleAddEntry}
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteEntry}
          onUpdateChallenge={handleUpdateChallenge}
          onArchiveChallenge={handleArchiveChallenge}
        />
        <Toaster />
      </>
    )
  }

  if (viewMode === 'leaderboard') {
    return (
      <>
        <LeaderboardView
          userId={userId}
          onBack={() => setViewMode('dashboard')}
        />
        <Toaster />
      </>
    )
  }

  if (viewMode === 'public-challenges') {
    return (
      <>
        <PublicChallengesView
          userId={userId}
          onBack={() => setViewMode('dashboard')}
        />
        <Toaster />
      </>
    )
  }

  const totalChallenges = activeChallenges.length
  const totalEntriesToday = entries.filter(
    (e) => e.date === new Date().toISOString().split('T')[0]
  ).length

  return (
    <div className="min-h-screen bg-background tally-marks-bg">
      <div className="max-w-7xl mx-auto p-4 pb-8">
        <header className="mb-8 mt-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-5xl font-bold tracking-tight mb-2 flex items-center gap-3">
                <span className="text-foreground">Tally</span>
                <svg width="40" height="50" viewBox="0 0 40 50" className="inline-block">
                  <line x1="10" y1="5" x2="10" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <line x1="17" y1="5" x2="17" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <line x1="24" y1="5" x2="24" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <line x1="31" y1="5" x2="31" y2="45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <line x1="5" y1="20" x2="35" y2="30" stroke="oklch(0.55 0.22 25)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </h1>
              <p className="text-muted-foreground text-lg">
                Count what matters. Mark your progress.
              </p>
              {totalChallenges > 0 && (
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{totalChallenges}</span> active challenge{totalChallenges !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {totalEntriesToday > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{totalEntriesToday}</span> {totalEntriesToday === 1 ? 'entry' : 'entries'} today
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-start gap-3">
              <UserProfile />
              <div className="flex gap-2 flex-wrap justify-end">
                <Button
                  onClick={() => setViewMode('leaderboard')}
                  size="lg"
                  variant="outline"
                  className="shadow-lg"
                >
                  <Trophy className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline">Leaderboard</span>
                </Button>
                <Button
                  onClick={() => setViewMode('public-challenges')}
                  size="lg"
                  variant="outline"
                  className="shadow-lg"
                >
                  <Users className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline">Community</span>
                </Button>
                {activeChallenges.length > 0 && (
                  <>
                    <Button
                      onClick={() => setWeeklySummaryOpen(true)}
                      size="lg"
                      variant="outline"
                      className="shadow-lg"
                    >
                      <Calendar className="w-5 h-5 md:mr-2" />
                      <span className="hidden md:inline">Weekly Summary</span>
                    </Button>
                    <Button
                      onClick={() => setAddEntryOpen(true)}
                      size="lg"
                      className="shadow-lg"
                    >
                      <Plus className="w-5 h-5 md:mr-2" />
                      <span className="hidden md:inline">Add Entry</span>
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => setExportImportOpen(true)}
                  size="lg"
                  variant="outline"
                  className="shadow-lg"
                >
                  <Database className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline">Backup</span>
                </Button>
                <Button
                  onClick={() => setCreateChallengeOpen(true)}
                  size="lg"
                  variant="secondary"
                  className="shadow-lg"
                >
                  <Target className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline">New Challenge</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {activeChallenges.length > 0 && (
          <OverallStats challenges={activeChallenges} entries={entries || []} />
        )}

        {activeChallenges.length > 0 && (
          <PersonalRecords challenges={activeChallenges} entries={entries || []} />
        )}

        {activeChallenges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Target className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No challenges yet</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first challenge and start tracking your progress towards greatness
            </p>
            <Button onClick={() => setCreateChallengeOpen(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Challenge
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <ChallengeCard
                  challenge={challenge}
                  entries={entries || []}
                  onClick={() => setSelectedChallengeId(challenge.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AddEntrySheet
        open={addEntryOpen}
        onOpenChange={setAddEntryOpen}
        challenges={activeChallenges}
        onAddEntry={handleAddEntry}
      />

      <CreateChallengeDialog
        open={createChallengeOpen}
        onOpenChange={setCreateChallengeOpen}
        onCreateChallenge={handleCreateChallenge}
      />

      <ExportImportDialog
        open={exportImportOpen}
        onOpenChange={setExportImportOpen}
        challenges={challenges}
        entries={entries}
        onImport={handleImportData}
        onClearAll={handleClearAllData}
        userId={userId}
      />

      <WeeklySummaryDialog
        open={weeklySummaryOpen}
        onOpenChange={setWeeklySummaryOpen}
        challenges={challenges}
        entries={entries}
      />

      <Toaster />
    </div>
  )
}

export default App