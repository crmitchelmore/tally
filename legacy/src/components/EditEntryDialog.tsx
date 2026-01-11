import { useState } from 'react'
import { Entry, FeelingType } from '@/types'
import { FEELING_OPTIONS } from '@/lib/constants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface EditEntryDialogProps {
  entry: Entry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateEntry: (entryId: string, count: number, note: string, date: string, feeling?: FeelingType) => void
  onDeleteEntry: (entryId: string) => void
}

export function EditEntryDialog({
  entry,
  open,
  onOpenChange,
  onUpdateEntry,
  onDeleteEntry,
}: EditEntryDialogProps) {
  const [count, setCount] = useState(entry?.count.toString() || '1')
  const [note, setNote] = useState(entry?.note || '')
  const [date, setDate] = useState(entry?.date || '')
  const [feeling, setFeeling] = useState<FeelingType | undefined>(entry?.feeling)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!entry) return

    const countNum = parseInt(count)
    if (isNaN(countNum) || countNum < 1) return

    onUpdateEntry(entry.id, countNum, note, date, feeling)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!entry) return
    onDeleteEntry(entry.id)
    setDeleteDialogOpen(false)
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && entry) {
      setCount(entry.count.toString())
      setNote(entry.note || '')
      setDate(entry.date)
      setFeeling(entry.feeling)
    }
    onOpenChange(newOpen)
  }

  if (!entry) return null

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
            <DialogDescription>
              Make changes to your entry. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-count">Count</Label>
                <Input
                  id="edit-count"
                  type="number"
                  min="1"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="0"
                  className="text-2xl font-bold geist-mono"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>How did it feel? (optional)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {FEELING_OPTIONS.map((option) => (
                    <motion.button
                      key={option.type}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFeeling(feeling === option.type ? undefined : option.type)}
                      className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                        feeling === option.type
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                      title={option.description}
                    >
                      <span className="text-xl">{option.emoji}</span>
                      <span className="text-[10px] font-medium text-center leading-tight">{option.label.split(' ')[0]}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-note">Note (optional)</Label>
                <Textarea
                  id="edit-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note about this entry..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this entry of {entry.count} from{' '}
              {new Date(entry.date).toLocaleDateString()}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
