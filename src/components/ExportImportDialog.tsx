import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Download, Upload, FileJson, FileText, AlertTriangle } from 'lucide-react'
import { Challenge, Entry } from '@/types'
import { exportToJSON, exportToCSV, downloadFile, parseImportedJSON, parseImportedCSV } from '@/lib/exportImport'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ExportImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenges: Challenge[]
  entries: Entry[]
  onImport: (challenges: Challenge[], entries: Entry[]) => void
}

export function ExportImportDialog({
  open,
  onOpenChange,
  challenges,
  entries,
  onImport,
}: ExportImportDialogProps) {
  const [importing, setImporting] = useState(false)

  const handleExportJSON = () => {
    const json = exportToJSON(challenges, entries)
    const filename = `tally-backup-${new Date().toISOString().split('T')[0]}.json`
    downloadFile(json, filename, 'application/json')
    toast.success('Data exported!', {
      description: `${challenges.length} challenges and ${entries.length} entries exported to ${filename}`,
    })
  }

  const handleExportCSV = () => {
    const csv = exportToCSV(challenges, entries)
    const filename = `tally-backup-${new Date().toISOString().split('T')[0]}.csv`
    downloadFile(csv, filename, 'text/csv')
    toast.success('Data exported!', {
      description: `${challenges.length} challenges and ${entries.length} entries exported to ${filename}`,
    })
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        let importedData: { challenges: Challenge[], entries: Entry[] }

        if (file.name.endsWith('.json')) {
          importedData = parseImportedJSON(content)
        } else if (file.name.endsWith('.csv')) {
          importedData = parseImportedCSV(content)
        } else {
          throw new Error('Unsupported file format. Please use .json or .csv')
        }

        onImport(importedData.challenges, importedData.entries)
        toast.success('Data imported successfully!', {
          description: `Loaded ${importedData.challenges.length} challenges and ${importedData.entries.length} entries`,
        })
        onOpenChange(false)
        setImporting(false)
      } catch (error) {
        toast.error('Import failed', {
          description: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export / Import Data</DialogTitle>
          <DialogDescription>
            Backup your challenges and entries or restore from a previous backup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">Export Data</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Download all your challenges and entries
            </p>
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Challenges:</span>
                  <span className="font-semibold geist-mono">{challenges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entries:</span>
                  <span className="font-semibold geist-mono">{entries.length}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleExportJSON}
                variant="outline"
                className="flex-1"
                disabled={challenges.length === 0 && entries.length === 0}
              >
                <FileJson className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="flex-1"
                disabled={challenges.length === 0 && entries.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
            {challenges.length === 0 && entries.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                No data to export yet
              </p>
            )}
          </div>

          <div className="border-t pt-6">
            <Label className="text-base font-semibold mb-3 block">Import Data</Label>
            
            {!importing ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Restore from a backup file
                </p>
                <Alert variant="destructive" className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Importing will replace all existing data
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => setImporting(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import from File
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This will permanently delete all current challenges and entries
                  </AlertDescription>
                </Alert>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleImportFile}
                  className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
                <Button
                  onClick={() => setImporting(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
