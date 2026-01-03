import { Challenge, Entry, FeelingType } from '@/types'

export interface ExportData {
  version: string
  exportDate: string
  userId?: string
  challenges: Challenge[]
  entries: Entry[]
}

export const exportToJSON = (challenges: Challenge[], entries: Entry[], userId?: string | null): string => {
  const data: ExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    challenges,
    entries,
  }
  
  if (userId) {
    data.userId = userId
  }
  
  return JSON.stringify(data, null, 2)
}

export const exportToCSV = (challenges: Challenge[], entries: Entry[], userId?: string | null): string => {
  let output = ''
  
  if (userId) {
    output += `USER ID: ${userId}\n\n`
  }
  
  const challengesCSV = convertChallengesToCSV(challenges)
  const entriesCSV = convertEntriesToCSV(entries)
  
  return output + `CHALLENGES\n${challengesCSV}\n\nENTRIES\n${entriesCSV}`
}

const convertChallengesToCSV = (challenges: Challenge[]): string => {
  if (challenges.length === 0) return 'No challenges'
  
  const headers = 'ID,User ID,Name,Target Number,Year,Color,Icon,Created At,Archived'
  const rows = challenges.map(c => 
    `"${c.id}","${c.userId}","${c.name}",${c.targetNumber},${c.year},"${c.color}","${c.icon}","${c.createdAt}",${c.archived}`
  )
  
  return [headers, ...rows].join('\n')
}

const convertEntriesToCSV = (entries: Entry[]): string => {
  if (entries.length === 0) return 'No entries'
  
  const headers = 'ID,User ID,Challenge ID,Date,Count,Note,Sets,Feeling'
  const rows = entries.map(e => {
    const noteValue = (e.note || '').replace(/"/g, '""')
    const setsValue = e.sets ? JSON.stringify(e.sets).replace(/"/g, '""') : ''
    const feelingValue = e.feeling || ''
    
    return `"${e.id}","${e.userId}","${e.challengeId}","${e.date}",${e.count},"${noteValue}","${setsValue}","${feelingValue}"`
  })
  
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
    let workingContent = content
    
    if (content.includes('USER ID:')) {
      const lines = content.split('\n')
      workingContent = lines.slice(2).join('\n')
    }
    
    const sections = workingContent.split('\n\n')
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
        userId: values.length >= 9 ? values[1] : '',
        name: values.length >= 9 ? values[2] : values[1],
        targetNumber: parseInt(values.length >= 9 ? values[3] : values[2]),
        year: parseInt(values.length >= 9 ? values[4] : values[3]),
        color: values.length >= 9 ? values[5] : values[4],
        icon: values.length >= 9 ? values[6] : values[5],
        createdAt: values.length >= 9 ? values[7] : values[6],
        archived: (values.length >= 9 ? values[8] : values[7]) === 'true',
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
        userId: values.length >= 8 ? values[1] : '',
        challengeId: values.length >= 8 ? values[2] : values[1],
        date: values.length >= 8 ? values[3] : values[2],
        count: parseInt(values.length >= 8 ? values[4] : values[3]),
      }
      
      const noteIdx = values.length >= 8 ? 5 : 4
      const setsIdx = values.length >= 8 ? 6 : 5
      const feelingIdx = values.length >= 8 ? 7 : 6
      
      if (values[noteIdx] && values[noteIdx].trim()) {
        entry.note = values[noteIdx]
      }
      
      if (values[setsIdx] && values[setsIdx].trim()) {
        try {
          const unescapedSets = values[setsIdx].replace(/""/g, '"')
          entry.sets = JSON.parse(unescapedSets)
        } catch {
          // ignore invalid sets
        }
      }
      
      if (values[feelingIdx] && values[feelingIdx].trim()) {
        entry.feeling = values[feelingIdx] as FeelingType
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
    const nextChar = i < line.length - 1 ? line[i + 1] : null
    
    if (char === '"' && nextChar === '"' && inQuotes) {
      current += '"'
      i++
    } else if (char === '"') {
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
