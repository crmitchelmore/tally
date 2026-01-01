import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CHALLENGE_COLORS, CHALLENGE_ICONS } from '@/lib/constants'
import { Challenge } from '@/types'
import { motion } from 'framer-motion'
import {
  Flame,
  Dumbbell,
  Heart,
  Target,
  Zap,
  Trophy,
  Star,
  BookOpen,
  Coffee,
  Bike,
  Footprints,
  PenTool,
  Camera,
  Music,
  Palette,
  Code,
  Rocket,
  Sun,
  Moon,
  Cloud,
} from 'lucide-react'

interface CreateChallengeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt'>) => void
}

const iconMap = {
  flame: Flame,
  dumbbell: Dumbbell,
  heart: Heart,
  target: Target,
  zap: Zap,
  trophy: Trophy,
  star: Star,
  'book-open': BookOpen,
  coffee: Coffee,
  bike: Bike,
  footprints: Footprints,
  'pen-tool': PenTool,
  camera: Camera,
  music: Music,
  palette: Palette,
  code: Code,
  rocket: Rocket,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
}

export function CreateChallengeDialog({
  open,
  onOpenChange,
  onCreateChallenge,
}: CreateChallengeDialogProps) {
  const currentYear = new Date().getFullYear()
  const [name, setName] = useState('')
  const [targetNumber, setTargetNumber] = useState<number>(10000)
  const [year, setYear] = useState(currentYear)
  const [selectedColor, setSelectedColor] = useState(CHALLENGE_COLORS[0].value)
  const [selectedIcon, setSelectedIcon] = useState<string>(CHALLENGE_ICONS[0])

  const handleSubmit = () => {
    if (!name.trim() || targetNumber <= 0) return

    onCreateChallenge({
      name: name.trim(),
      targetNumber,
      year,
      color: selectedColor,
      icon: selectedIcon,
      archived: false,
    })

    setName('')
    setTargetNumber(10000)
    setYear(currentYear)
    setSelectedColor(CHALLENGE_COLORS[0].value)
    setSelectedIcon(CHALLENGE_ICONS[0])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Challenge</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label className="text-sm mb-2 block">Challenge Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Push-ups, Books Read, Miles Run"
              className="text-base"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-2 block">Target Number</Label>
              <Input
                type="number"
                value={targetNumber}
                onChange={(e) => setTargetNumber(parseInt(e.target.value) || 0)}
                min="1"
                className="text-base"
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || currentYear)}
                min={currentYear}
                className="text-base"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {CHALLENGE_COLORS.map((color) => (
                <motion.button
                  key={color.value}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-full aspect-square rounded-lg border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:border-border'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Icon</Label>
            <div className="grid grid-cols-10 gap-2">
              {CHALLENGE_ICONS.map((iconName) => {
                const IconComponent = iconMap[iconName as keyof typeof iconMap]
                return (
                  <motion.button
                    key={iconName}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedIcon(iconName)}
                    className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                      selectedIcon === iconName
                        ? 'border-primary bg-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-secondary'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: selectedColor }} />
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || targetNumber <= 0}
              className="flex-1"
            >
              Create Challenge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
