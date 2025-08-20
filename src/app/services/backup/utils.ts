/**
 * Backup utility functions
 */

import { BACKUP_CONSTANTS } from './constants'
import type { BackupData, BackupMetadata, VocabularyItem } from './types'

/**
 * Format date for backup filename
 * @param timestamp - Unix timestamp
 * @returns Formatted filename with streamfluency prefix
 */
export function formatBackupFilename(timestamp: number): string {
  const date = new Date(timestamp)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  // Use streamfluency prefix for all backups
  const filename = `streamfluency-${day}-${month}-${year}-${timestamp}${BACKUP_CONSTANTS.FILE_EXTENSION}`

  return filename
}

/**
 * Parse backup filename to extract metadata
 * @param filename - Backup filename
 * @returns Backup metadata
 */
export function parseBackupFilename(filename: string): BackupMetadata | null {
  // New format: streamfluency-DD-MM-YYYY-timestamp.json
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

  // Fallback to simple format: DD-MM-YYYY-timestamp.json
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

/**
 * Validate backup data structure
 * @param data - Data to validate
 * @returns True if valid backup data
 */
export function validateBackupData(data: any): data is BackupData {
  if (!data || typeof data !== 'object') return false

  // Check required fields
  if (typeof data.version !== 'string') return false
  if (typeof data.timestamp !== 'number') return false
  if (!data.data || typeof data.data !== 'object') return false

  // Check vocabulary array
  if (!Array.isArray(data.data.vocabulary)) return false

  // Check settings object
  if (!data.data.settings || typeof data.data.settings !== 'object')
    return false

  // Validate version format (major.minor.patch)
  const versionRegex = /^\d+\.\d+\.\d+$/
  if (!versionRegex.test(data.version)) return false

  // Validate timestamp is reasonable (not in future, not too old)
  const now = Date.now()
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000
  if (data.timestamp > now || data.timestamp < oneYearAgo) {
    console.warn('Backup timestamp seems invalid:', new Date(data.timestamp))
  }

  return true
}

/**
 * Sanitize backup data before import
 * @param data - Backup data to sanitize
 * @returns Sanitized backup data
 */
export function sanitizeBackupData(data: BackupData): BackupData {
  // Deep clone to avoid mutations
  const sanitized = JSON.parse(JSON.stringify(data))

  // Sanitize vocabulary items
  if (sanitized.data.vocabulary) {
    sanitized.data.vocabulary = sanitized.data.vocabulary.map(
      (item: VocabularyItem) => ({
        ...item,
        // Remove any HTML tags from text fields
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

/**
 * Remove HTML tags and dangerous characters from string
 * @param str - String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(str: string): string {
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

/**
 * Calculate interval in milliseconds from frequency
 * @param frequency - Backup frequency
 * @returns Interval in milliseconds
 */
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

/**
 * Create a blob from backup data
 * @param data - Backup data
 * @returns Blob object
 */
export function createBackupBlob(data: BackupData): Blob {
  const jsonString = JSON.stringify(data, null, 2)
  return new Blob([jsonString], { type: BACKUP_CONSTANTS.MIME_TYPE })
}

/**
 * Download blob as file
 * @param blob - Blob to download
 * @param filename - Filename for download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url

  // HTML download attribute doesn't support folder paths
  // Extract just the filename part
  const parts = filename.split('/')
  const file = parts[parts.length - 1]
  link.download = file

  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Check if running in extension context
 * @returns True if running as browser extension
 */
export function isExtensionContext(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    chrome.runtime.id !== undefined
  )
}

/**
 * Sort backups by timestamp (newest first)
 * @param backups - Array of backups to sort
 * @returns Sorted array
 */
export function sortBackupsByDate(backups: BackupData[]): BackupData[] {
  return [...backups].sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Limit number of backups keeping newest
 * @param backups - Array of backups
 * @param maxBackups - Maximum number to keep
 * @returns Limited array
 */
export function limitBackups(
  backups: BackupData[],
  maxBackups: number
): BackupData[] {
  return sortBackupsByDate(backups).slice(0, maxBackups)
}
