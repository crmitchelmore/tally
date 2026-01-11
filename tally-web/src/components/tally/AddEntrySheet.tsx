"use client";

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Challenge, SetData, FeelingType } from '@/types'
import { QUICK_ADD_PRESETS, FEELING_OPTIONS } from '@/lib/constants'
import { Plus, Minus, Check, X, Dumbbell } from 'lucide-react'
import canvasConfetti from 'canvas-confetti'
import { useReducedMotion, useMotionPreference } from '@/hooks/use-reduced-motion'

interface AddEntrySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenges: Challenge[]
  onAddEntry: (challengeId: string, count: number, note: string, date: string, sets?: SetData[], feeling?: FeelingType) => void
}

export function AddEntrySheet({
  open,
  onOpenChange,
  challenges,
  onAddEntry,
}: AddEntrySheetProps) {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    challenges.length === 1 ? challenges[0].id : ''
  )
  const [count, setCount] = useState<number>(0)
  const [note, setNote] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [showNote, setShowNote] = useState(false)
  const [trackSets, setTrackSets] = useState(false)
  const [sets, setSets] = useState<SetData[]>([])
  const [feeling, setFeeling] = useState<FeelingType | undefined>(undefined)
  
  const prefersReducedMotion = useReducedMotion()
  const { shouldAnimate, tapScale } = useMotionPreference()

  // Auto-select when only one challenge and sheet opens
  const autoSelectId = open && challenges.length === 1 ? challenges[0].id : null;
  if (autoSelectId && !selectedChallengeId) {
    setSelectedChallengeId(autoSelectId);
  }

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      setCount(0)
      setNote('')
      setDate(new Date().toISOString().split('T')[0])
      setShowNote(false)
      setTrackSets(false)
      setSets([])
      setFeeling(undefined)
      setSelectedChallengeId('')
    }
  }

  const handleSubmit = () => {
    if (!selectedChallengeId) return
    if (trackSets && sets.length === 0) return
    if (!trackSets && count <= 0) return

    const finalCount = trackSets 
      ? sets.reduce((sum, set) => sum + set.reps, 0)
      : count

    // Call the Convex mutation via the callback
    onAddEntry(
      selectedChallengeId,
      finalCount,
      note,
      date,
      trackSets ? sets : undefined,
      feeling
    )

    // Only show confetti when reduced motion is not preferred
    if (!prefersReducedMotion) {
      canvasConfetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3a3a3a', '#4a4a4a', '#5a5a5a', '#6a6a6a'],
        shapes: ['square'],
        scalar: 0.8,
      })
    }

    // Haptics are generally OK even with reduced motion, but keep them subtle
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50])
    }

    setCount(0)
    setNote('')
    setDate(new Date().toISOString().split('T')[0])
    setShowNote(false)
    setTrackSets(false)
    setSets([])
    setFeeling(undefined)
    onOpenChange(false)
  }

  const addSet = () => {
    const lastReps = sets.length > 0 ? sets[sets.length - 1].reps : 0
    setSets([...sets, { reps: lastReps }])
  }

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index))
  }

  const updateSetReps = (index: number, reps: number) => {
    const newSets = [...sets]
    newSets[index] = { reps: Math.max(0, reps) }
    setSets(newSets)
  }

  const totalReps = sets.reduce((sum, set) => sum + set.reps, 0)

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId)

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="top-1/2 -translate-y-1/2 bottom-auto h-auto max-h-[85vh] sm:max-w-md sm:mx-auto p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle className="text-2xl">Add Entry</SheetTitle>
          {challenges.length > 1 && (
            <p className="text-sm text-muted-foreground">Select a challenge to log progress</p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6 pt-6">
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

                  <div className="flex items-center gap-2">
                    <Button
                      variant={!trackSets ? 'default' : 'outline'}
                      onClick={() => {
                        setTrackSets(false)
                        setSets([])
                      }}
                      className="flex-1"
                    >
                      Simple Count
                    </Button>
                    <Button
                      variant={trackSets ? 'default' : 'outline'}
                      onClick={() => {
                        setTrackSets(true)
                        if (sets.length === 0) setSets([{ reps: 0 }])
                      }}
                      className="flex-1"
                    >
                      <Dumbbell className="w-4 h-4 mr-2" />
                      Sets & Reps
                    </Button>
                  </div>

                  {!trackSets ? (
                    <div>
                      <Label className="text-sm mb-2 block">Count</Label>
                      <div className="flex items-center gap-3 mb-3">
                        <motion.button
                          whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                          onClick={() => setCount(Math.max(0, count - 1))}
                          className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                          aria-label="Decrease count"
                        >
                          <Minus className="w-6 h-6" />
                        </motion.button>

                        <Input
                          type="number"
                          value={count || ''}
                          onChange={(e) => setCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="text-center text-5xl font-bold font-mono h-20 flex-1"
                          style={{ color: selectedChallenge?.color }}
                          placeholder="0"
                          min="0"
                          aria-label="Entry count"
                        />

                        <motion.button
                          whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                          onClick={() => setCount(count + 1)}
                          className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
                          aria-label="Increase count"
                        >
                          <Plus className="w-6 h-6 text-primary-foreground" />
                        </motion.button>
                      </div>

                      <div className="grid grid-cols-6 gap-2">
                        {QUICK_ADD_PRESETS.map((preset) => (
                          <motion.button
                            key={preset}
                            whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                            onClick={() => setCount(count + preset)}
                            className="px-3 py-2 rounded-md bg-secondary hover:bg-primary/20 text-sm font-medium transition-colors border border-border hover:border-primary/50"
                            aria-label={`Add ${preset}`}
                          >
                            +{preset}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Sets & Reps</Label>
                        {sets.length > 0 && (
                          <Badge variant="secondary" className="font-mono">
                            Total: {totalReps} reps
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {sets.map((set, index) => (
                          <motion.div
                            key={index}
                            initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border"
                          >
                            <span className="text-sm font-semibold text-muted-foreground w-12">
                              Set {index + 1}
                            </span>
                            <div className="flex items-center gap-2 flex-1">
                              <motion.button
                                whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                                onClick={() => updateSetReps(index, set.reps - 1)}
                                className="w-8 h-8 rounded-full bg-background hover:bg-muted flex items-center justify-center transition-colors"
                                aria-label={`Decrease reps for set ${index + 1}`}
                              >
                                <Minus className="w-4 h-4" />
                              </motion.button>

                              <Input
                                type="number"
                                value={set.reps || ''}
                                onChange={(e) => updateSetReps(index, parseInt(e.target.value) || 0)}
                                className="text-center text-lg font-bold font-mono h-10 flex-1"
                                placeholder="0"
                                min="0"
                                aria-label={`Reps for set ${index + 1}`}
                              />

                              <motion.button
                                whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                                onClick={() => updateSetReps(index, set.reps + 1)}
                                className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
                                aria-label={`Increase reps for set ${index + 1}`}
                              >
                                <Plus className="w-4 h-4 text-primary-foreground" />
                              </motion.button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSet(index)}
                              className="h-8 w-8"
                              aria-label={`Remove set ${index + 1}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        onClick={addSet}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Set
                      </Button>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm mb-2 block">How did it feel? (optional)</Label>
                    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="How did it feel?">
                      {FEELING_OPTIONS.map((option) => (
                        <motion.button
                          key={option.type}
                          type="button"
                          role="radio"
                          aria-checked={feeling === option.type}
                          whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                          onClick={() => setFeeling(feeling === option.type ? undefined : option.type)}
                          className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                            feeling === option.type
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-border bg-card hover:border-primary/30'
                          }`}
                          aria-label={option.description}
                        >
                          <span className="text-2xl" aria-hidden="true">{option.emoji}</span>
                          <span className="text-xs font-medium text-center leading-tight">{option.label.split(' ')[0]}</span>
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
                    disabled={trackSets ? sets.length === 0 || totalReps === 0 : count <= 0}
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
