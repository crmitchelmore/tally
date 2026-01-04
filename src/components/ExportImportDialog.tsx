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
import { Download, Upload, FileJson, FileText, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { Challenge, Entry } from '@/types'
import { exportToJSON, exportToCSV, downloadFile, parseImportedJSON, parseImportedCSV, validateImportData, ValidationResult } from '@/lib/exportImport'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface ExportImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenges: Challenge[]
  entries: Entry[]
  onImport: (challenges: Challenge[], entries: Entry[]) => void
  onClearAll: () => void
  userId: string | null
}

export function ExportImportDialog({
  open,
  onOpenChange,
  challenges,
  entries,
  onImport,
  onClearAll,
  userId,
}: ExportImportDialogProps) {
  const [importing, setImporting] = useState(false)
  const [clearingData, setClearingData] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const handleExportJSON = () => {
    try {
      const json = exportToJSON(challenges, entries, userId)
      const filename = `tally-backup-${new Date().toISOString().split('T')[0]}.json`
      downloadFile(json, filename, 'application/json')
      toast.success('Data exported!', {
        description: `${challenges.length} challenges and ${entries.length} entries exported to ${filename}`,
      })
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Could not download file',
      })
    }
  }

  const handleExportCSV = () => {
    try {
      const csv = exportToCSV(challenges, entries, userId)
      const filename = `tally-backup-${new Date().toISOString().split('T')[0]}.csv`
      downloadFile(csv, filename, 'text/csv')
      toast.success('Data exported!', {
        description: `${challenges.length} challenges and ${entries.length} entries exported to ${filename}`,
      })
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Could not download file',
      })
    }
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

        const validation = validateImportData(importedData.challenges, importedData.entries)
        setValidationResult(validation)
        
      } catch (error) {
        toast.error('Import failed', {
          description: error instanceof Error ? error.message : 'Unknown error',
        })
        setImporting(false)
        event.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = () => {
    if (!validationResult) return

    onImport(validationResult.challenges, validationResult.entries)
    
    toast.success('Data imported successfully!', {
      description: `Loaded ${validationResult.stats.validChallenges} challenges and ${validationResult.stats.validEntries} entries`,
    })
    
    setValidationResult(null)
    setImporting(false)
    onOpenChange(false)
  }

  const handleCancelValidation = () => {
    setValidationResult(null)
    setImporting(false)
  }

  const handleClearData = () => {
    onClearAll()
    onOpenChange(false)
    setClearingData(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export / Import Data</DialogTitle>
          <DialogDescription>
            Backup your challenges and entries or restore from a previous backup
          </DialogDescription>
        </DialogHeader>

        {validationResult ? (
          <div className="flex-1 overflow-hidden flex flex-col py-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Import Validation Results</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancelValidation}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-sm text-muted-foreground mb-1">Challenges</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{validationResult.stats.validChallenges}</span>
                  <span className="text-sm text-muted-foreground">/ {validationResult.stats.totalChallenges}</span>
                </div>
                {validationResult.stats.invalidChallenges > 0 && (
                  <Badge variant="destructive" className="mt-2 text-xs">
                    {validationResult.stats.invalidChallenges} invalid
                  </Badge>
                )}
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="text-sm text-muted-foreground mb-1">Entries</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{validationResult.stats.validEntries}</span>
                  <span className="text-sm text-muted-foreground">/ {validationResult.stats.totalEntries}</span>
                </div>
                {validationResult.stats.invalidEntries > 0 && (
                  <Badge variant="destructive" className="mt-2 text-xs">
                    {validationResult.stats.invalidEntries} invalid
                  </Badge>
                )}
              </div>
            </div>

            {validationResult.warnings.length > 0 && (
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-4 space-y-3">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Issues Found ({validationResult.warnings.length})
                  </div>
                  {validationResult.warnings.map((warning, index) => (
                    <Alert
                      key={index}
                      variant={warning.type === 'error' ? 'destructive' : 'default'}
                      className="py-3"
                    >
                      {warning.type === 'error' && <AlertTriangle className="h-4 w-4" />}
                      {warning.type === 'warning' && <Info className="h-4 w-4 text-yellow-600" />}
                      {warning.type === 'info' && <Info className="h-4 w-4" />}
                      <div className="space-y-1">
                        <AlertTitle className="text-sm font-semibold leading-none">
                          {warning.message}
                        </AlertTitle>
                        {warning.details && (
                          <AlertDescription className="text-xs">
                            {warning.details}
                          </AlertDescription>
                        )}
                      </div>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            )}

            {validationResult.warnings.length === 0 && (
              <Alert className="border-green-600/20 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900 dark:text-green-100">
                  All data is valid!
                </AlertTitle>
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {validationResult.stats.validChallenges} challenges and {validationResult.stats.validEntries} entries are ready to import.
                </AlertDescription>
              </Alert>
            )}

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This will permanently replace all current challenges and entries
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleConfirmImport}
                disabled={validationResult.stats.validChallenges === 0}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Confirm Import
              </Button>
              <Button
                onClick={handleCancelValidation}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
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

            <div className="border-t pt-6">
              <Label className="text-base font-semibold mb-3 block text-destructive">Danger Zone</Label>
              
              {!clearingData ? (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete all your challenges and entries
                  </p>
                  <Button
                    onClick={() => setClearingData(true)}
                    variant="outline"
                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm font-semibold">
                      This action cannot be undone! All {challenges.length} challenges and {entries.length} entries will be permanently deleted.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleClearData}
                      variant="destructive"
                      className="flex-1"
                    >
                      Yes, Delete Everything
                    </Button>
                    <Button
                      onClick={() => setClearingData(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!validationResult && (
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
