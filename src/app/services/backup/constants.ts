export const BACKUP_CONSTANTS = {
  VERSION: '1.0.0',
  STORAGE_KEYS: {
    AUTO_BACKUPS: 'streamfluency_auto_backups',
    CONFIG: 'streamfluency_auto_backup_config',
  },
  FOLDERS: {
    MANUAL: 'streamfluency-backups',
    AUTO: 'streamfluency-backups-auto',
  },
  LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    MAX_BACKUPS_DEFAULT: 7,
    MIN_BACKUPS: 1,
    MAX_BACKUPS: 30,
  },
  INTERVALS: {
    HOURLY: 60 * 60 * 1000,
    DAILY: 24 * 60 * 60 * 1000,
    WEEKLY: 7 * 24 * 60 * 60 * 1000,
  },
  TIMEOUTS: {
    DOWNLOAD: 30000,
    CHECK_INTERVAL: 500,
  },
  FILE_EXTENSION: '.json',
  MIME_TYPE: 'application/json',
} as const

export const DEFAULT_CONFIG = {
  enabled: false,
  frequency: 'daily' as const,
  maxBackups: 7,
  autoDownload: false,
}
