"use client";

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CHALLENGE_COLORS, CHALLENGE_ICONS } from '@/lib/constants'
import { Challenge, TimeframeUnit } from '@/types'
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
  Globe,
  Lock,
} from 'lucide-react'

interface CreateChallengeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateChallenge: (challenge: Omit<Challenge, 'id' | 'createdAt' | 'userId'>) => void
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
  const currentMonth = new Date().getMonth()
  const today = new Date().toISOString().split('T')[0]
  
  const [name, setName] = useState('')
  const [targetNumber, setTargetNumber] = useState<number>(10000)
  const [selectedColor, setSelectedColor] = useState(CHALLENGE_COLORS[0].value)
  const [selectedIcon, setSelectedIcon] = useState<string>(CHALLENGE_ICONS[0])
  const [isPublic, setIsPublic] = useState(false)
  const [timeframeUnit, setTimeframeUnit] = useState<TimeframeUnit>('year')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth + 1)
  const [startDate, setStartDate] = useState(today)
  const [customDays, setCustomDays] = useState<number>(30)

  const getMonthOptions = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    const now = new Date()
    const currentYearNum = now.getFullYear()
    const currentMonthNum = now.getMonth()
    
    const options: { value: number; label: string; year: number }[] = []
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonthNum + 1 + i) % 12
      const yearOffset = Math.floor((currentMonthNum + 1 + i) / 12)
      const year = currentYearNum + yearOffset
      
      options.push({
        value: monthIndex,
        label: `${months[monthIndex]} ${year}`,
        year: year
      })
    }
    
    return options
  }

  const calculateDateRange = (): { startDate?: string; endDate?: string; year: number } => {
    switch (timeframeUnit) {
      case 'year': {
        const yearStart = new Date(selectedYear, 0, 1).toISOString().split('T')[0]
        const yearEnd = new Date(selectedYear, 11, 31).toISOString().split('T')[0]
        return { startDate: yearStart, endDate: yearEnd, year: selectedYear }
      }
      case 'month': {
        const monthOptions = getMonthOptions()
        const selected = monthOptions.find(m => m.value === selectedMonth)
        const year = selected?.year || currentYear
        const monthStart = new Date(year, selectedMonth, 1).toISOString().split('T')[0]
        const monthEnd = new Date(year, selectedMonth + 1, 0).toISOString().split('T')[0]
        return { startDate: monthStart, endDate: monthEnd, year }
      }
      case 'custom': {
        const start = new Date(startDate)
        const end = new Date(start)
        end.setDate(end.getDate() + customDays - 1)
        return { 
          startDate: startDate, 
          endDate: end.toISOString().split('T')[0], 
          year: start.getFullYear() 
        }
      }
      default:
        return { year: currentYear }
    }
  }

  const handleSubmit = () => {
    if (!name.trim() || targetNumber <= 0) return

    const { startDate: finalStartDate, endDate: finalEndDate, year: finalYear } = calculateDateRange()

    onCreateChallenge({
      name: name.trim(),
      targetNumber,
      year: finalYear,
      color: selectedColor,
      icon: selectedIcon,
      archived: false,
      isPublic,
      timeframeUnit,
      startDate: finalStartDate,
      endDate: finalEndDate,
    })

    setName('')
    setTargetNumber(10000)
    setSelectedColor(CHALLENGE_COLORS[0].value)
    setSelectedIcon(CHALLENGE_ICONS[0])
    setIsPublic(false)
    setTimeframeUnit('year')
    setSelectedYear(currentYear)
    setSelectedMonth(currentMonth + 1)
    setStartDate(today)
    setCustomDays(30)
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
              <Label className="text-sm mb-2 block">Timeframe</Label>
              <Select value={timeframeUnit} onValueChange={(value) => setTimeframeUnit(value as TimeframeUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
            {timeframeUnit === 'year' && (
              <div>
                <Label className="text-sm mb-2 block">Select Year</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => currentYear + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {timeframeUnit === 'month' && (
              <div>
                <Label className="text-sm mb-2 block">Select Month</Label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthOptions().map(option => (
                      <SelectItem key={`${option.year}-${option.value}`} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {timeframeUnit === 'custom' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm mb-2 block">Number of Days</Label>
                  <Input
                    type="number"
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                    min="1"
                    className="text-base"
                    placeholder="e.g., 30, 50, 1000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    End date: {new Date(new Date(startDate).getTime() + (customDays - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  </p>
                </div>
              </div>
            )}
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

          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                {isPublic ? (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Label className="text-sm font-semibold cursor-pointer" htmlFor="public-toggle">
                    {isPublic ? 'Public Challenge' : 'Private Challenge'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublic 
                      ? 'Visible on leaderboards and community challenges' 
                      : 'Only you can see this challenge'}
                  </p>
                </div>
              </div>
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
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
