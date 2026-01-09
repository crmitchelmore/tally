"use client";

import { Entry } from '@/types'
import { FEELING_OPTIONS } from '@/lib/constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { Pencil } from 'lucide-react'

interface DayEntriesDialogProps {
  date: string
  entries: Entry[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditEntry: (entry: Entry) => void
}

export function DayEntriesDialog({
  date,
  entries,
  open,
  onOpenChange,
  onEditEntry,
}: DayEntriesDialogProps) {
  const dateObj = new Date(date)
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const totalCount = entries.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{formattedDate}</DialogTitle>
          <DialogDescription>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} • Total: {totalCount}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No entries for this day
            </div>
          ) : (
            entries.map((entry) => {
              const feelingOption = entry.feeling ? FEELING_OPTIONS.find((o) => o.type === entry.feeling) : null
              
              return (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-4 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary/70 transition-colors group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-lg font-mono">
                        {entry.count} reps
                      </div>
                      {feelingOption && (
                        <span className="text-lg" title={feelingOption.description}>
                          {feelingOption.emoji}
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <div className="text-sm text-muted-foreground">{entry.note}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-60 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      onEditEntry(entry)
                      onOpenChange(false)
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
