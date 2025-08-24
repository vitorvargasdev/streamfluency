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

  private constructor() {}

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

    return backupData
  }

  async downloadBackup(_isAuto = false): Promise<void> {
    try {
      const backup = this.exportBackup()
      const filename = formatBackupFilename(backup.timestamp)

      if (
        isExtensionContext() &&
        chrome.runtime &&
        typeof chrome.runtime.sendMessage === 'function'
      ) {
        try {
          const success = await this.downloadViaExtension(backup, filename)
          if (success) return
        } catch (error) {}
      }

      this.downloadDirect(backup, filename)
    } catch (error) {
      throw error
    }
  }

  private downloadDirect(backup: BackupData, filename: string): void {
    const blob = createBackupBlob(backup)
    downloadBlob(blob, filename)
  }

  private async downloadViaExtension(
    backup: BackupData,
    filename: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'downloadBackup', backup, filename },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve(false)
          } else {
            resolve(response?.success === true)
          }
        }
      )
    })
  }

  async importBackup(file: File): Promise<void> {
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

          if (!validateBackupData(data)) {
            throw new Error('Invalid backup file format')
          }

          const sanitized = sanitizeBackupData(data)
          await this.importData(sanitized)
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsText(file)
    })
  }

  private async importData(backup: BackupData): Promise<void> {
    const vocabularyStore = useVocabularyStore()
    const settingStore = useSettingStore()

    vocabularyStore.items = backup.data.vocabulary
    await vocabularyStore.saveToStorage()

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

  getAutoBackupConfig(): AutoBackupConfig {
    try {
      const stored = localStorage.getItem(BACKUP_CONSTANTS.STORAGE_KEYS.CONFIG)
      if (stored) {
        const config = JSON.parse(stored)
        return { ...DEFAULT_CONFIG, ...config }
      }
    } catch (error) {}

    return DEFAULT_CONFIG
  }

  setAutoBackupConfig(config: AutoBackupConfig): void {
    const previousConfig = this.getAutoBackupConfig()

    localStorage.setItem(
      BACKUP_CONSTANTS.STORAGE_KEYS.CONFIG,
      JSON.stringify(config)
    )

    if (config.enabled && config.autoDownload) {
      const justEnabled =
        !previousConfig.enabled || !previousConfig.autoDownload
      this.scheduleAutoBackup(config.frequency, justEnabled)
    } else {
      this.cancelAutoBackup()
    }
  }

  private async performAutoBackup(): Promise<void> {
    try {
      await this.downloadBackup(true)
    } catch (error) {}
  }

  private scheduleAutoBackup(frequency: string, immediate = false): void {
    if (this.isScheduling) return

    this.isScheduling = true
    this.cancelAutoBackup()

    const interval = getIntervalFromFrequency(frequency)

    if (interval < 60000) {
      this.isScheduling = false
      return
    }

    this.autoBackupInterval = window.setInterval(async () => {
      await this.performAutoBackup()
    }, interval)

    if (immediate) {
      this.performAutoBackup()
    }

    this.isScheduling = false
  }

  private cancelAutoBackup(): void {
    if (this.autoBackupInterval === null) return

    clearInterval(this.autoBackupInterval)
    this.autoBackupInterval = null
  }

  async initAutoBackup(): Promise<void> {
    if (this.isInitialized) return

    this.isInitialized = true

    const config = this.getAutoBackupConfig()
    if (config.enabled && config.autoDownload) {
      this.scheduleAutoBackup(config.frequency, false)
    }
  }
}
