import { BACKUP_CONSTANTS } from './constants'
import type { BackupData, BackupMetadata, VocabularyItem } from './types'

export function formatBackupFilename(timestamp: number): string {
  const date = new Date(timestamp)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  const filename = `streamfluency-${day}-${month}-${year}-${timestamp}${BACKUP_CONSTANTS.FILE_EXTENSION}`

  return filename
}

export function parseBackupFilename(filename: string): BackupMetadata | null {
  const prefixRegex = /streamfluency-(\d{2})-(\d{2})-(\d{4})-(\d+)\.json$/
  const prefixMatch = filename.match(prefixRegex)

  if (prefixMatch) {
    const [, , , , timestamp] = prefixMatch
    const createdAt = parseInt(timestamp, 10)

    return {
      filename: filename,
      path: filename,
      createdAt,
    }
  }

  const regex = /(\d{2})-(\d{2})-(\d{4})-(\d+)\.json$/
  const match = filename.match(regex)

  if (!match) return null

  const [, , , , timestamp] = match
  const createdAt = parseInt(timestamp, 10)

  return {
    filename: filename.split('/').pop() || filename,
    path: filename,
    createdAt,
  }
}

export function validateBackupData(data: any): data is BackupData {
  if (!data || typeof data !== 'object') return false

  if (typeof data.version !== 'string') return false
  if (typeof data.timestamp !== 'number') return false
  if (!data.data || typeof data.data !== 'object') return false

  if (!Array.isArray(data.data.vocabulary)) return false

  if (!data.data.settings || typeof data.data.settings !== 'object')
    return false

  const versionRegex = /^\d+\.\d+\.\d+$/
  if (!versionRegex.test(data.version)) return false

  return true
}

export function sanitizeBackupData(data: BackupData): BackupData {
  const sanitized = JSON.parse(JSON.stringify(data))

  if (sanitized.data.vocabulary) {
    sanitized.data.vocabulary = sanitized.data.vocabulary.map(
      (item: VocabularyItem) => ({
        ...item,
        text: sanitizeString(item.text),
        context: item.context ? sanitizeString(item.context) : undefined,
        translation: item.translation
          ? sanitizeString(item.translation)
          : undefined,
        notes: item.notes ? sanitizeString(item.notes) : undefined,
        videoTitle: item.videoTitle
          ? sanitizeString(item.videoTitle)
          : undefined,
      })
    )
  }

  return sanitized
}

function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim()
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

export function getIntervalFromFrequency(frequency: string): number {
  switch (frequency) {
    case 'hourly':
      return BACKUP_CONSTANTS.INTERVALS.HOURLY
    case 'daily':
      return BACKUP_CONSTANTS.INTERVALS.DAILY
    case 'weekly':
      return BACKUP_CONSTANTS.INTERVALS.WEEKLY
    default:
      return BACKUP_CONSTANTS.INTERVALS.DAILY
  }
}

export function createBackupBlob(data: BackupData): Blob {
  const jsonString = JSON.stringify(data, null, 2)
  return new Blob([jsonString], { type: BACKUP_CONSTANTS.MIME_TYPE })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url

  const parts = filename.split('/')
  const file = parts[parts.length - 1]
  link.download = file

  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function isExtensionContext(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    chrome.runtime.id !== undefined
  )
}

export function sortBackupsByDate(backups: BackupData[]): BackupData[] {
  return [...backups].sort((a, b) => b.timestamp - a.timestamp)
}

export function limitBackups(
  backups: BackupData[],
  maxBackups: number
): BackupData[] {
  return sortBackupsByDate(backups).slice(0, maxBackups)
}
