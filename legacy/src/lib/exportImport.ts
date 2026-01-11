import { Challenge, Entry, FeelingType } from '@/types'

export interface ExportData {
  version: string
  exportDate: string
  userId?: string
  challenges: Challenge[]
  entries: Entry[]
}

export interface ValidationWarning {
  type: 'error' | 'warning' | 'info'
  message: string
  details?: string
}

export interface ValidationResult {
  valid: boolean
  warnings: ValidationWarning[]
  challenges: Challenge[]
  entries: Entry[]
  stats: {
    totalChallenges: number
    validChallenges: number
    invalidChallenges: number
    totalEntries: number
    validEntries: number
    invalidEntries: number
    orphanedEntries: number
  }
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
  
  const headers = 'ID,Name,Target Number,Year,Color,Icon,Created At,Archived'
  const rows = challenges.map(c => 
    `"${c.id}","${c.name}",${c.targetNumber},${c.year},"${c.color}","${c.icon}","${c.createdAt}",${c.archived.toString().toUpperCase()}`
  )
  
  return [headers, ...rows].join('\n')
}

const convertEntriesToCSV = (entries: Entry[]): string => {
  if (entries.length === 0) return 'No entries'
  
  const headers = 'ID,Challenge ID,Date,Count,Note,Sets,Feeling'
  const rows = entries.map(e => {
    const noteValue = (e.note || '').replace(/"/g, '""')
    const setsValue = e.sets ? JSON.stringify(e.sets).replace(/"/g, '""') : ''
    const feelingValue = e.feeling || ''
    
    return `"${e.id}","${e.challengeId}","${e.date}",${e.count},"${noteValue}","${setsValue}","${feelingValue}"`
  })
  
  return [headers, ...rows].join('\n')
}

export const downloadFile = (content: string, filename: string, type: string) => {
  try {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    console.error('Download failed:', error)
    throw new Error('Failed to download file')
  }
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
    
    const challengesMarker = 'CHALLENGES\n'
    const entriesMarker = '\n\nENTRIES\n'
    
    let challengesSection = ''
    let entriesSection = ''
    
    const challengesIndex = workingContent.indexOf(challengesMarker)
    const entriesIndex = workingContent.indexOf(entriesMarker)
    
    if (challengesIndex !== -1 && entriesIndex !== -1) {
      challengesSection = workingContent.substring(
        challengesIndex + challengesMarker.length,
        entriesIndex
      ).trim()
      
      entriesSection = workingContent.substring(
        entriesIndex + entriesMarker.length
      ).trim()
    } else if (challengesIndex !== -1) {
      challengesSection = workingContent.substring(
        challengesIndex + challengesMarker.length
      ).trim()
    } else if (entriesIndex !== -1) {
      entriesSection = workingContent.substring(
        entriesIndex + entriesMarker.length
      ).trim()
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
  
  const headerLine = lines[0].toLowerCase()
  const hasUserIdColumn = headerLine.includes('user id')
  
  const challenges: Challenge[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    
    try {
      let challenge: Challenge | null = null
      
      if (hasUserIdColumn && values.length >= 9) {
        const targetNumber = parseInt(values[3])
        const year = parseInt(values[4])
        
        if (isNaN(targetNumber) || isNaN(year) || !values[0] || !values[2]) {
          continue
        }
        
        challenge = {
          id: values[0].trim(),
          userId: values[1].trim(),
          name: values[2].trim(),
          targetNumber,
          year,
          color: values[5].trim(),
          icon: values[6].trim(),
          createdAt: values[7].trim(),
          archived: values[8].toUpperCase() === 'TRUE',
        }
      } else if (!hasUserIdColumn && values.length >= 8) {
        const targetNumber = parseInt(values[2])
        const year = parseInt(values[3])
        
        if (isNaN(targetNumber) || isNaN(year) || !values[0] || !values[1]) {
          continue
        }
        
        challenge = {
          id: values[0].trim(),
          userId: '',
          name: values[1].trim(),
          targetNumber,
          year,
          color: values[4].trim(),
          icon: values[5].trim(),
          createdAt: values[6].trim(),
          archived: values[7].toUpperCase() === 'TRUE',
        }
      }
      
      if (challenge && challenge.name && challenge.id) {
        challenges.push(challenge)
      }
    } catch (error) {
      console.warn(`Skipping invalid challenge row ${i}:`, error)
    }
  }
  
  return challenges
}

const parseEntriesCSV = (csv: string): Entry[] => {
  if (csv === 'No entries') return []
  
  const lines = csv.split('\n').filter(line => line.trim())
  if (lines.length <= 1) return []
  
  const headerLine = lines[0].toLowerCase()
  const hasUserIdColumn = headerLine.includes('user id')
  
  const entries: Entry[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    
    try {
      let entry: Entry | null = null
      
      if (hasUserIdColumn && values.length >= 5) {
        const count = parseInt(values[4])
        
        if (isNaN(count) || !values[0] || !values[2] || !values[3]) {
          continue
        }
        
        const normalizedDate = normalizeDateString(values[3].trim())
        
        entry = {
          id: values[0].trim(),
          userId: values[1].trim(),
          challengeId: values[2].trim(),
          date: normalizedDate,
          count,
        }
        
        if (values[5] && values[5].trim()) {
          entry.note = values[5].trim()
        }
        
        if (values[6] && values[6].trim()) {
          try {
            const unescapedSets = values[6].replace(/""/g, '"')
            entry.sets = JSON.parse(unescapedSets)
          } catch {
          }
        }
        
        if (values[7] && values[7].trim()) {
          entry.feeling = values[7].trim() as FeelingType
        }
      } else if (!hasUserIdColumn && values.length >= 4) {
        const count = parseInt(values[3])
        
        if (isNaN(count) || !values[0] || !values[1] || !values[2]) {
          continue
        }
        
        const normalizedDate = normalizeDateString(values[2].trim())
        
        entry = {
          id: values[0].trim(),
          userId: '',
          challengeId: values[1].trim(),
          date: normalizedDate,
          count,
        }
        
        if (values[4] && values[4].trim()) {
          entry.note = values[4].trim()
        }
        
        if (values[5] && values[5].trim()) {
          try {
            const unescapedSets = values[5].replace(/""/g, '"')
            entry.sets = JSON.parse(unescapedSets)
          } catch {
          }
        }
        
        if (values[6] && values[6].trim()) {
          entry.feeling = values[6].trim() as FeelingType
        }
      }
      
      if (entry && entry.id && entry.challengeId) {
        entries.push(entry)
      }
    } catch (error) {
      console.warn(`Skipping invalid entry row ${i}:`, error)
    }
  }
  
  return entries
}

const normalizeDateString = (dateStr: string): string => {
  if (dateStr.includes('-')) {
    return dateStr
  }
  
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0')
      const month = parts[1].padStart(2, '0')
      const year = parts[2]
      return `${year}-${month}-${day}`
    }
  }
  
  return dateStr
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

export const validateImportData = (challenges: Challenge[], entries: Entry[]): ValidationResult => {
  const warnings: ValidationWarning[] = []
  const validChallenges: Challenge[] = []
  const validEntries: Entry[] = []
  let invalidChallenges = 0
  let invalidEntries = 0
  let orphanedEntries = 0
  
  const challengeIds = new Set<string>()
  const duplicateChallengeIds = new Set<string>()
  const currentYear = new Date().getFullYear()
  
  for (const challenge of challenges) {
    let isValid = true
    const issues: string[] = []
    
    if (!challenge.id || challenge.id.trim() === '') {
      issues.push('missing ID')
      isValid = false
    } else if (challengeIds.has(challenge.id)) {
      duplicateChallengeIds.add(challenge.id)
      issues.push('duplicate ID')
      isValid = false
    } else {
      challengeIds.add(challenge.id)
    }
    
    if (!challenge.name || challenge.name.trim() === '') {
      issues.push('missing name')
      isValid = false
    }
    
    if (!challenge.targetNumber || challenge.targetNumber <= 0 || isNaN(challenge.targetNumber)) {
      issues.push('invalid target number')
      isValid = false
    }
    
    if (!challenge.year || isNaN(challenge.year) || challenge.year < 2000 || challenge.year > 2100) {
      issues.push('invalid year')
      isValid = false
    }
    
    if (challenge.year && challenge.year < currentYear - 10) {
      warnings.push({
        type: 'warning',
        message: `Challenge "${challenge.name}" is from ${challenge.year}`,
        details: 'This is more than 10 years old'
      })
    }
    
    if (isValid) {
      validChallenges.push(challenge)
    } else {
      invalidChallenges++
      warnings.push({
        type: 'error',
        message: `Invalid challenge: ${challenge.name || 'Unknown'}`,
        details: issues.join(', ')
      })
    }
  }
  
  if (duplicateChallengeIds.size > 0) {
    warnings.push({
      type: 'error',
      message: `Found ${duplicateChallengeIds.size} duplicate challenge IDs`,
      details: 'Only the first occurrence will be imported'
    })
  }
  
  const entryIds = new Set<string>()
  const duplicateEntryIds = new Set<string>()
  
  for (const entry of entries) {
    let isValid = true
    const issues: string[] = []
    
    if (!entry.id || entry.id.trim() === '') {
      issues.push('missing ID')
      isValid = false
    } else if (entryIds.has(entry.id)) {
      duplicateEntryIds.add(entry.id)
      issues.push('duplicate ID')
      isValid = false
    } else {
      entryIds.add(entry.id)
    }
    
    if (!entry.challengeId || entry.challengeId.trim() === '') {
      issues.push('missing challenge ID')
      isValid = false
    } else if (!challengeIds.has(entry.challengeId)) {
      orphanedEntries++
      issues.push('challenge not found')
      isValid = false
    }
    
    if (!entry.date || entry.date.trim() === '') {
      issues.push('missing date')
      isValid = false
    } else {
      const dateObj = new Date(entry.date)
      if (isNaN(dateObj.getTime())) {
        issues.push('invalid date format')
        isValid = false
      }
    }
    
    if (entry.count === undefined || entry.count === null || isNaN(entry.count) || entry.count < 0) {
      issues.push('invalid count')
      isValid = false
    }
    
    if (entry.sets) {
      if (!Array.isArray(entry.sets)) {
        issues.push('sets must be an array')
        isValid = false
      } else {
        for (const set of entry.sets) {
          if (!set.reps || isNaN(set.reps) || set.reps <= 0) {
            issues.push('invalid set reps')
            isValid = false
            break
          }
        }
      }
    }
    
    if (isValid) {
      validEntries.push(entry)
    } else {
      invalidEntries++
      const challengeName = challenges.find(c => c.id === entry.challengeId)?.name || 'Unknown'
      warnings.push({
        type: 'error',
        message: `Invalid entry for "${challengeName}" on ${entry.date || 'unknown date'}`,
        details: issues.join(', ')
      })
    }
  }
  
  if (duplicateEntryIds.size > 0) {
    warnings.push({
      type: 'error',
      message: `Found ${duplicateEntryIds.size} duplicate entry IDs`,
      details: 'Only the first occurrence will be imported'
    })
  }
  
  if (orphanedEntries > 0) {
    warnings.push({
      type: 'error',
      message: `Found ${orphanedEntries} orphaned entries`,
      details: 'These entries reference challenges that don\'t exist in the import'
    })
  }
  
  if (validChallenges.length === 0 && challenges.length > 0) {
    warnings.push({
      type: 'error',
      message: 'No valid challenges found',
      details: 'All challenges have errors and will be skipped'
    })
  }
  
  if (validEntries.length === 0 && entries.length > 0) {
    warnings.push({
      type: 'warning',
      message: 'No valid entries found',
      details: 'All entries have errors and will be skipped'
    })
  }
  
  if (validChallenges.length > 0 && validEntries.length === 0) {
    warnings.push({
      type: 'info',
      message: 'Challenges will be imported without any entries',
      details: 'You can add entries manually after import'
    })
  }
  
  const hasErrors = warnings.some(w => w.type === 'error')
  const valid = validChallenges.length > 0 && !hasErrors
  
  return {
    valid,
    warnings,
    challenges: validChallenges,
    entries: validEntries,
    stats: {
      totalChallenges: challenges.length,
      validChallenges: validChallenges.length,
      invalidChallenges,
      totalEntries: entries.length,
      validEntries: validEntries.length,
      invalidEntries,
      orphanedEntries
    }
  }
}
