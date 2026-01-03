import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Challenge, Set, FeelingType } from '@/types'
import { QUICK_ADD_PRESETS, FEELING_OPTIONS } from '@/lib/constants'
import { Plus, Minus, X, Dumbbell } from 'lucide-react'
import canvasConfetti from 'canvas-confetti'
import { Badge } from './ui/badge'

interface AddEntryDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenge: Challenge
  onAddEntry: (challengeId: string, count: number, note: string, date: string, sets?: Set[], feeling?: FeelingType) => void
}

export function AddEntryDetailSheet({
  open,
  onOpenChange,
  challenge,
  onAddEntry,
}: AddEntryDetailSheetProps) {
  const [count, setCount] = useState<number>(0)
  const [note, setNote] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [showNote, setShowNote] = useState(false)
  const [trackSets, setTrackSets] = useState(false)
  const [sets, setSets] = useState<Set[]>([])
  const [feeling, setFeeling] = useState<FeelingType | undefined>(undefined)

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) {
      setCount(0)
      setNote('')
      setDate(new Date().toISOString().split('T')[0])
      setShowNote(false)
      setTrackSets(false)
      setSets([])
      setFeeling(undefined)
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = () => {
    if (trackSets && sets.length === 0) return
    if (!trackSets && count <= 0) return

    const finalCount = trackSets 
      ? sets.reduce((sum, set) => sum + set.reps, 0)
      : count

    onAddEntry(challenge.id, finalCount, note, date, trackSets ? sets : undefined, feeling)

    canvasConfetti({
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

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto sm:max-w-md sm:mx-auto p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle className="text-2xl">Add Entry</SheetTitle>
          <div className="flex items-center gap-2 pt-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: challenge.color }}
            />
            <span className="text-sm font-semibold">{challenge.name}</span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6 pt-6">
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
                    style={{ color: challenge.color }}
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
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Sets & Reps</Label>
                  {sets.length > 0 && (
                    <Badge variant="secondary" className="geist-mono">
                      Total: {totalReps} reps
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sets.map((set, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <span className="text-sm font-semibold text-muted-foreground w-12">
                        Set {index + 1}
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateSetReps(index, set.reps - 1)}
                          className="w-8 h-8 rounded-full bg-background hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>

                        <Input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => updateSetReps(index, parseInt(e.target.value) || 0)}
                          className="text-center text-lg font-bold geist-mono h-10 flex-1"
                          placeholder="0"
                          min="0"
                        />

                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateSetReps(index, set.reps + 1)}
                          className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4 text-primary-foreground" />
                        </motion.button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSet(index)}
                        className="h-8 w-8"
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
              <div className="grid grid-cols-5 gap-2">
                {FEELING_OPTIONS.map((option) => (
                  <motion.button
                    key={option.type}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFeeling(feeling === option.type ? undefined : option.type)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      feeling === option.type
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                    title={option.description}
                  >
                    <span className="text-2xl">{option.emoji}</span>
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
