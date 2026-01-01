import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Challenge, Entry } from '@/types'
import { ChallengeCard } from '@/components/ChallengeCard'
import { AddEntrySheet } from '@/components/AddEntrySheet'
import { CreateChallengeDialog } from '@/components/CreateChallengeDialog'
import { ChallengeDetailView } from '@/components/ChallengeDetailView'
import { OverallStats } from '@/components/OverallStats'
import { Button } from '@/components/ui/button'
import { Plus, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

function App() {
  const [challenges, setChallenges] = useKV<Challenge[]>('challenges', [])
  const [entries, setEntries] = useKV<Entry[]>('entries', [])
  const [addEntryOpen, setAddEntryOpen] = useState(false)
  const [createChallengeOpen, setCreateChallengeOpen] = useState(false)
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const activeChallenges = (challenges || []).filter(
    (c) => !c.archived && c.year >= currentYear
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleCreateChallenge = (
    challengeData: Omit<Challenge, 'id' | 'createdAt'>
  ) => {
    const newChallenge: Challenge = {
      ...challengeData,
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    setChallenges((current) => [...(current || []), newChallenge])
    toast.success('Challenge created! 🎯', {
      description: `Ready to crush ${newChallenge.targetNumber.toLocaleString()} ${newChallenge.name}!`,
    })
  }

  const handleAddEntry = (
    challengeId: string,
    count: number,
    note: string,
    date: string
  ) => {
    const newEntry: Entry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      challengeId,
      date,
      count,
      note: note || undefined,
    }

    setEntries((current) => [...(current || []), newEntry])
    
    const challenge = (challenges || []).find((c) => c.id === challengeId)
    toast.success('Entry logged! 🔥', {
      description: `Added ${count} to ${challenge?.name}`,
    })
  }

  const selectedChallenge = (challenges || []).find((c) => c.id === selectedChallengeId)

  if (selectedChallenge) {
    return (
      <>
        <ChallengeDetailView
          challenge={selectedChallenge}
          entries={entries || []}
          onBack={() => setSelectedChallengeId(null)}
        />
        <Toaster />
      </>
    )
  }

  const totalChallenges = activeChallenges.length
  const totalEntriesToday = (entries || []).filter(
    (e) => e.date === new Date().toISOString().split('T')[0]
  ).length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 pb-24">
        <header className="mb-8 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  10000 Club
                </span>
              </h1>
              <p className="text-muted-foreground">
                Track your yearly challenges and crush your goals
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
            <Button
              onClick={() => setCreateChallengeOpen(true)}
              size="lg"
              className="hidden md:flex"
            >
              <Target className="w-5 h-5 mr-2" />
              New Challenge
            </Button>
          </div>
        </header>

        {activeChallenges.length > 0 && (
          <OverallStats challenges={activeChallenges} entries={entries || []} />
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

      <motion.div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
      >
        <Button
          onClick={() => setAddEntryOpen(true)}
          size="lg"
          className="w-16 h-16 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
          disabled={activeChallenges.length === 0}
        >
          <Plus className="w-8 h-8" />
        </Button>
        {activeChallenges.length > 0 && (
          <Button
            onClick={() => setCreateChallengeOpen(true)}
            size="lg"
            variant="secondary"
            className="md:hidden rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all px-5"
          >
            <Target className="w-5 h-5 mr-2" />
            New Challenge
          </Button>
        )}
      </motion.div>

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

      <Toaster />
    </div>
  )
}

export default App