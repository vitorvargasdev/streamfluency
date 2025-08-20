/**
 * Simplified backup service - Export/Import only
 * Auto-backups are downloaded directly to disk
 */

import { useVocabularyStore } from '../../stores/vocabulary'
import { useSettingStore } from '../../stores/setting'
import { BACKUP_CONSTANTS, DEFAULT_CONFIG } from './constants'
import {
  formatBackupFilename,
  validateBackupData,
  sanitizeBackupData,
  createBackupBlob,
  downloadBlob,
  isExtensionContext,
  getIntervalFromFrequency,
} from './utils'
import type { BackupData, AutoBackupConfig } from './types'

export class BackupService {
  private static instance: BackupService | null = null
  private autoBackupInterval: number | null = null
  private isInitialized = false
  private isScheduling = false

  static getInstance(): BackupService {
    if (!this.instance) {
      this.instance = new BackupService()
    }
    return this.instance
  }

  private constructor() {
    console.log('BackupService initialized')
  }

  /**
   * Export current data as backup
   */
  exportBackup(): BackupData {
    const vocabularyStore = useVocabularyStore()
    const settingStore = useSettingStore()

    const backupData: BackupData = {
      version: BACKUP_CONSTANTS.VERSION,
      timestamp: Date.now(),
      data: {
        vocabulary: vocabularyStore.items,
        settings: {
          languages: settingStore.languages,
          blurNativeSubtitle: settingStore.blurNativeSubtitle,
          showNativeSubtitle: settingStore.showNativeSubtitle,
          isEnabled: settingStore.isEnabled,
          subtitleViewMode: settingStore.subtitleViewMode,
          providers: settingStore.providers,
        },
      },
    }

    console.debug('Backup exported', {
      vocabularyCount: backupData.data.vocabulary.length,
      timestamp: new Date(backupData.timestamp).toISOString(),
    })

    return backupData
  }

  /**
   * Download backup file (manual or auto)
   */
  async downloadBackup(isAuto = false): Promise<void> {
    console.log('Downloading backup', { isAuto })

    try {
      const backup = this.exportBackup()
      const filename = formatBackupFilename(backup.timestamp)

      console.log(`Filename generated: ${filename}`)

      // Try extension API first for proper folder support
      if (
        isExtensionContext() &&
        chrome.runtime &&
        typeof chrome.runtime.sendMessage === 'function'
      ) {
        try {
          const success = await this.downloadViaExtension(backup, filename)
          if (success) {
            console.log(`Backup saved via extension to ${filename}`)
            return
          }
        } catch (error) {
          console.warn('Extension download failed, using fallback', error)
        }
      }

      // Fallback to direct download (will save to default Downloads)
      console.warn(
        'Using fallback download - will save to Downloads folder without subfolder'
      )
      this.downloadDirect(backup, filename)
    } catch (error) {
      console.error('Failed to download backup', error)
      throw error
    }
  }

  /**
   * Direct download via blob (no folder support)
   */
  private downloadDirect(backup: BackupData, filename: string): void {
    const blob = createBackupBlob(backup)
    downloadBlob(blob, filename)
  }

  /**
   * Download via Chrome extension API (supports folders)
   */
  private async downloadViaExtension(
    backup: BackupData,
    filename: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      console.log(`Attempting extension download for: ${filename}`)

      chrome.runtime.sendMessage(
        { action: 'downloadBackup', backup, filename },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn(
              'Extension API error:',
              chrome.runtime.lastError.message
            )
            resolve(false)
          } else {
            console.log('Extension response:', response)
            resolve(response?.success === true)
          }
        }
      )
    })
  }

  /**
   * Import backup from file
   */
  async importBackup(file: File): Promise<void> {
    console.log('Importing backup', {
      filename: file.name,
      size: file.size,
    })

    // Validate file size
    if (file.size > BACKUP_CONSTANTS.LIMITS.MAX_FILE_SIZE) {
      throw new Error(
        `File too large (max ${BACKUP_CONSTANTS.LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB)`
      )
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)

          // Validate and sanitize
          if (!validateBackupData(data)) {
            throw new Error('Invalid backup file format')
          }

          const sanitized = sanitizeBackupData(data)
          await this.importData(sanitized)

          console.log('Backup imported successfully')
          resolve()
        } catch (error) {
          console.error('Failed to import backup', error)
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsText(file)
    })
  }

  /**
   * Import data into stores
   */
  private async importData(backup: BackupData): Promise<void> {
    const vocabularyStore = useVocabularyStore()
    const settingStore = useSettingStore()

    // Import vocabulary
    vocabularyStore.items = backup.data.vocabulary
    await vocabularyStore.saveToStorage()

    // Import settings
    const settings = backup.data.settings
    Object.assign(settingStore, {
      languages: settings.languages,
      blurNativeSubtitle: settings.blurNativeSubtitle,
      showNativeSubtitle: settings.showNativeSubtitle,
      isEnabled: settings.isEnabled,
      subtitleViewMode: settings.subtitleViewMode,
      providers: settings.providers,
    })
    settingStore.saveToLocalStorage()
  }

  /**
   * Get auto-backup configuration
   */
  getAutoBackupConfig(): AutoBackupConfig {
    try {
      const stored = localStorage.getItem(BACKUP_CONSTANTS.STORAGE_KEYS.CONFIG)
      if (stored) {
        const config = JSON.parse(stored)
        return { ...DEFAULT_CONFIG, ...config }
      }
    } catch (error) {
      console.warn('Failed to load auto-backup config', error)
    }

    return DEFAULT_CONFIG
  }

  /**
   * Set auto-backup configuration
   */
  setAutoBackupConfig(config: AutoBackupConfig): void {
    console.log('Setting auto-backup config', config)

    const previousConfig = this.getAutoBackupConfig()

    localStorage.setItem(
      BACKUP_CONSTANTS.STORAGE_KEYS.CONFIG,
      JSON.stringify(config)
    )

    // Update schedule
    if (config.enabled && config.autoDownload) {
      // Only trigger immediate backup if user just enabled it (not on app start)
      const justEnabled =
        !previousConfig.enabled || !previousConfig.autoDownload
      this.scheduleAutoBackup(config.frequency, justEnabled)
    } else {
      this.cancelAutoBackup()
    }
  }

  /**
   * Perform auto-backup (download only, no storage)
   */
  private async performAutoBackup(): Promise<void> {
    console.log('Performing auto-backup')

    try {
      await this.downloadBackup(true) // true = auto backup
      console.log('Auto-backup completed')
    } catch (error) {
      console.error('Auto-backup failed', error)
    }
  }

  /**
   * Schedule auto-backup with protection against duplicates
   */
  private scheduleAutoBackup(frequency: string, immediate = false): void {
    // Prevent concurrent scheduling
    if (this.isScheduling) {
      console.warn('Already scheduling auto-backup, skipping duplicate call')
      return
    }

    this.isScheduling = true

    // Always cancel existing schedule first to prevent duplicates
    this.cancelAutoBackup()

    const interval = getIntervalFromFrequency(frequency)

    console.log('Scheduling auto-backup', {
      frequency,
      interval,
      intervalHours: interval / (60 * 60 * 1000),
      immediate,
    })

    // Ensure we have a reasonable interval (minimum 1 minute for testing, but normally 1 hour)
    if (interval < 60000) {
      console.error('Invalid interval, too short:', interval)
      this.isScheduling = false
      return
    }

    this.autoBackupInterval = window.setInterval(async () => {
      await this.performAutoBackup()
    }, interval)

    // Only perform immediate backup if explicitly requested
    if (immediate) {
      this.performAutoBackup()
    }

    this.isScheduling = false
  }

  /**
   * Cancel auto-backup schedule
   */
  private cancelAutoBackup(): void {
    if (this.autoBackupInterval !== null) {
      clearInterval(this.autoBackupInterval)
      this.autoBackupInterval = null
      console.log('Auto-backup cancelled')
    }
  }

  /**
   * Initialize auto-backup with single initialization protection
   */
  async initAutoBackup(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.log('Auto-backup already initialized, skipping')
      return
    }

    this.isInitialized = true
    console.log('Initializing auto-backup service')

    const config = this.getAutoBackupConfig()
    if (config.enabled && config.autoDownload) {
      // Don't trigger immediate backup on app initialization
      this.scheduleAutoBackup(config.frequency, false)
    }
  }
}
