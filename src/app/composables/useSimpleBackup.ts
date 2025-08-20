/**
 * Simplified Vue composable for backup functionality
 * Only Export/Import and Auto-download configuration
 */

import { ref, onMounted } from 'vue'
import { BackupService } from '../services/backup/BackupService'
import type { AutoBackupConfig } from '../services/backup/types'

export function useSimpleBackup() {
  const service = BackupService.getInstance()

  // State
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const config = ref<AutoBackupConfig>({
    enabled: false,
    frequency: 'daily',
    maxBackups: 7,
    autoDownload: false,
  })

  // Export backup
  const exportBackup = async () => {
    isLoading.value = true
    error.value = null

    try {
      await service.downloadBackup(false) // false = manual backup
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Export failed'
      console.error('Export backup failed:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Import backup
  const importBackup = async (file: File) => {
    isLoading.value = true
    error.value = null

    try {
      await service.importBackup(file)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Import failed'
      console.error('Import backup failed:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Load configuration
  const loadConfig = () => {
    try {
      config.value = service.getAutoBackupConfig()
    } catch (err) {
      console.error('Failed to load config:', err)
    }
  }

  // Update configuration
  const updateConfig = async (newConfig: Partial<AutoBackupConfig>) => {
    try {
      const updatedConfig = { ...config.value, ...newConfig }
      service.setAutoBackupConfig(updatedConfig)
      config.value = updatedConfig
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Update failed'
      console.error('Update config failed:', err)
      return false
    }
  }

  // Format date helper
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Lifecycle
  onMounted(() => {
    loadConfig()
    // Auto-backup is already initialized in main.ts
  })

  return {
    // State
    isLoading,
    error,
    config,

    // Methods
    exportBackup,
    importBackup,
    loadConfig,
    updateConfig,
    formatDate,
  }
}
