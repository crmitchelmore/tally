import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Challenge, Entry, Set } from '@/types'
import { QUICK_ADD_PRESETS } from '@/lib/constants'
import { Plus, Minus, Check } from 'lucide-react'
import confetti from 'canvas-confetti'

interface AddEntrySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenges: Challenge[]
  onAddEntry: (challengeId: string, count: number, note: string, date: string, sets?: Set[]) => void
}

export function AddEntrySheet({
  open,
  onOpenChange,
  challenges,
  onAddEntry,
}: AddEntrySheetProps) {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('')
  const [count, setCount] = useState<number>(0)
  const [note, setNote] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [showNote, setShowNote] = useState(false)

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) {
      setCount(0)
      setNote('')
      setDate(new Date().toISOString().split('T')[0])
      setShowNote(false)
    } else {
      if (challenges.length === 1) {
        setSelectedChallengeId(challenges[0].id)
      }
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = () => {
    if (!selectedChallengeId || count <= 0) return

    onAddEntry(selectedChallengeId, count, note, date)

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#3a3a3a', '#4a4a4a', '#5a5a5a', '#6a6a6a'],
      shapes: ['square'],
      scalar: 0.8,
    })

    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50])
    }

    setCount(0)
    setNote('')
    setDate(new Date().toISOString().split('T')[0])
    setShowNote(false)
    onOpenChange(false)
  }

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId)

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto sm:max-w-md sm:mx-auto p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle className="text-2xl">Add Entry</SheetTitle>
          {challenges.length > 1 && (
            <p className="text-sm text-muted-foreground">Select a challenge to log progress</p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6">
            {challenges.length > 1 && (
              <div>
                <Label className="text-sm mb-2 block">Challenge</Label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {challenges
                    .filter((c) => !c.archived)
                    .map((challenge) => (
                      <motion.button
                        key={challenge.id}
                        onClick={() => setSelectedChallengeId(challenge.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedChallengeId === challenge.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: challenge.color }}
                            />
                            <span className="font-semibold">{challenge.name}</span>
                          </div>
                          {selectedChallengeId === challenge.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                </div>
              </div>
            )}

            {challenges.length === 1 && (
              <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: challenges[0].color }}
                  />
                  <span className="font-semibold">{challenges[0].name}</span>
                </div>
              </div>
            )}

            <AnimatePresence>
              {selectedChallengeId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <Label className="text-sm mb-2 block">Date</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="text-base"
                    />
                  </div>

                  <div>
                    <Label className="text-sm mb-2 block">Count</Label>
                    <div className="flex items-center gap-3 mb-3">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCount(Math.max(0, count - 1))}
                        className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-6 h-6" />
                      </motion.button>

                      <Input
                        type="number"
                        value={count || ''}
                        onChange={(e) => setCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="text-center text-5xl font-bold geist-mono h-20 flex-1"
                        style={{ color: selectedChallenge?.color }}
                        placeholder="0"
                        min="0"
                      />

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCount(count + 1)}
                        className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-6 h-6 text-primary-foreground" />
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {QUICK_ADD_PRESETS.map((preset) => (
                        <motion.button
                          key={preset}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCount(count + preset)}
                          className="px-3 py-2 rounded-md bg-secondary hover:bg-primary/20 text-sm font-medium transition-colors border border-border hover:border-primary/50"
                        >
                          +{preset}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    {!showNote ? (
                      <Button
                        variant="ghost"
                        onClick={() => setShowNote(true)}
                        className="w-full text-sm"
                      >
                        + Add note (optional)
                      </Button>
                    ) : (
                      <div>
                        <Label className="text-sm mb-2 block">Note</Label>
                        <Textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="How did it feel?"
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={count <= 0}
                    className="w-full h-14 text-lg font-semibold"
                    size="lg"
                  >
                    Done
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
