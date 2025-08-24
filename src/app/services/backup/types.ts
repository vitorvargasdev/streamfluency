export interface BackupData {
  version: string
  timestamp: number
  data: {
    vocabulary: VocabularyItem[]
    settings: BackupSettings
  }
}

export interface VocabularyItem {
  id: string
  text: string
  context?: string
  translation?: string
  notes?: string
  timestamp: number
  videoUrl?: string
  videoTitle?: string
  language?: string
}

export interface BackupSettings {
  languages: {
    native: string
    learning: string
  }
  blurNativeSubtitle: boolean
  showNativeSubtitle: boolean
  isEnabled: boolean
  subtitleViewMode: 'unified' | 'tabs'
  providers: {
    translation: string
    dictionary: string
    targetLanguage: string
  }
}

export interface AutoBackupConfig {
  enabled: boolean
  frequency: BackupFrequency
  maxBackups: number
  autoDownload: boolean
}

export type BackupFrequency = 'hourly' | 'daily' | 'weekly'

export interface BackupMetadata {
  filename: string
  path: string
  size?: number
  createdAt: number
}

export interface BackupServiceOptions {
  maxFileSize?: number
  allowedExtensions?: string[]
  defaultFrequency?: BackupFrequency
  defaultMaxBackups?: number
}

export class BackupError extends Error {
  constructor(
    message: string,
    public code: BackupErrorCode,
    public details?: any
  ) {
    super(message)
    this.name = 'BackupError'
  }
}

export enum BackupErrorCode {
  INVALID_FORMAT = 'INVALID_FORMAT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  STORAGE_FULL = 'STORAGE_FULL',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  IMPORT_FAILED = 'IMPORT_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}
