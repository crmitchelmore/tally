"use client";

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Challenge } from '@/types'
import { Globe, Lock, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface ChallengeSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenge: Challenge
  onUpdateChallenge: (challengeId: string, updates: Partial<Challenge>) => void
  onArchiveChallenge: (challengeId: string) => void
}

export function ChallengeSettingsDialog({
  open,
  onOpenChange,
  challenge,
  onUpdateChallenge,
  onArchiveChallenge,
}: ChallengeSettingsDialogProps) {
  const [isPublic, setIsPublic] = useState(challenge.isPublic || false)

  const handlePublicToggle = (checked: boolean) => {
    setIsPublic(checked)
    onUpdateChallenge(challenge.id, { isPublic: checked })
  }

  const handleArchive = () => {
    onArchiveChallenge(challenge.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Challenge Settings</DialogTitle>
          <DialogDescription>
            Manage settings for {challenge.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
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
                  <Label className="text-sm font-semibold cursor-pointer" htmlFor="public-toggle-settings">
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
                id="public-toggle-settings"
                checked={isPublic}
                onCheckedChange={handlePublicToggle}
              />
            </div>
          </div>

          <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Archive Challenge</h3>
                <p className="text-xs text-muted-foreground">
                  Move this challenge to your archived challenges. All entries will be preserved.
                </p>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  Archive Challenge
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive this challenge?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move &quot;{challenge.name}&quot; to your archived challenges. You can always unarchive it later. All your entries will be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchive}>
                    Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
