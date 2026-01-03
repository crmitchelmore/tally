import { Challenge, Entry, FeelingType } from '@/types'

export interface ExportData {
  version: string
  exportDate: string
  challenges: Challenge[]
  entries: Entry[]
}

export const exportToJSON = (challenges: Challenge[], entries: Entry[]): string => {
  const data: ExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    challenges,
    entries,
  }
  return JSON.stringify(data, null, 2)
}

export const exportToCSV = (challenges: Challenge[], entries: Entry[]): string => {
  const challengesCSV = convertChallengesToCSV(challenges)
  const entriesCSV = convertEntriesToCSV(entries)
  
  return `CHALLENGES\n${challengesCSV}\n\nENTRIES\n${entriesCSV}`
}

const convertChallengesToCSV = (challenges: Challenge[]): string => {
  if (challenges.length === 0) return 'No challenges'
  
  const headers = 'ID,Name,Target Number,Year,Color,Icon,Created At,Archived'
  const rows = challenges.map(c => 
    `"${c.id}","${c.name}",${c.targetNumber},${c.year},"${c.color}","${c.icon}","${c.createdAt}",${c.archived}`
  )
  
  return [headers, ...rows].join('\n')
}

const convertEntriesToCSV = (entries: Entry[]): string => {
  if (entries.length === 0) return 'No entries'
  
  const headers = 'ID,Challenge ID,Date,Count,Note,Sets,Feeling'
  const rows = entries.map(e => 
    `"${e.id}","${e.challengeId}","${e.date}",${e.count},"${e.note || ''}","${e.sets ? JSON.stringify(e.sets) : ''}","${e.feeling || ''}"`
  )
  
  return [headers, ...rows].join('\n')
}

export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const parseImportedJSON = (content: string): { challenges: Challenge[], entries: Entry[] } => {
  try {
    const data = JSON.parse(content) as ExportData
    
    if (!data.challenges || !data.entries) {
      throw new Error('Invalid JSON format: missing challenges or entries')
    }
    
    return {
      challenges: data.challenges,
      entries: data.entries,
    }
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const parseImportedCSV = (content: string): { challenges: Challenge[], entries: Entry[] } => {
  try {
    const sections = content.split('\n\n')
    let challengesSection = ''
    let entriesSection = ''
    
    for (const section of sections) {
      if (section.startsWith('CHALLENGES')) {
        challengesSection = section.replace('CHALLENGES\n', '')
      } else if (section.startsWith('ENTRIES')) {
        entriesSection = section.replace('ENTRIES\n', '')
      }
    }
    
    const challenges = parseChallengesCSV(challengesSection)
    const entries = parseEntriesCSV(entriesSection)
    
    return { challenges, entries }
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const parseChallengesCSV = (csv: string): Challenge[] => {
  if (csv === 'No challenges') return []
  
  const lines = csv.split('\n').filter(line => line.trim())
  if (lines.length <= 1) return []
  
  const challenges: Challenge[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length >= 8) {
      challenges.push({
        id: values[0],
        name: values[1],
        targetNumber: parseInt(values[2]),
        year: parseInt(values[3]),
        color: values[4],
        icon: values[5],
        createdAt: values[6],
        archived: values[7] === 'true',
      })
    }
  }
  
  return challenges
}

const parseEntriesCSV = (csv: string): Entry[] => {
  if (csv === 'No entries') return []
  
  const lines = csv.split('\n').filter(line => line.trim())
  if (lines.length <= 1) return []
  
  const entries: Entry[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length >= 4) {
      const entry: Entry = {
        id: values[0],
        challengeId: values[1],
        date: values[2],
        count: parseInt(values[3]),
      }
      
      if (values[4]) {
        entry.note = values[4]
      }
      
      if (values[5]) {
        try {
          entry.sets = JSON.parse(values[5])
        } catch {
          // ignore invalid sets
        }
      }
      
      if (values[6] && values[6].trim()) {
        entry.feeling = values[6] as FeelingType
      }
      
      entries.push(entry)
    }
  }
  
  return entries
}

const parseCSVLine = (line: string): string[] => {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  values.push(current)
  return values
}
