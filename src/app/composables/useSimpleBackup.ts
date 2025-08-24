import { ref, onMounted } from 'vue'
import { BackupService } from '../services/backup/BackupService'
import type { AutoBackupConfig } from '../services/backup/types'

export function useSimpleBackup() {
  const service = BackupService.getInstance()

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const config = ref<AutoBackupConfig>({
    enabled: false,
    frequency: 'daily',
    maxBackups: 7,
    autoDownload: false,
  })

  const exportBackup = async () => {
    isLoading.value = true
    error.value = null

    try {
      await service.downloadBackup(false)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Export failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const importBackup = async (file: File) => {
    isLoading.value = true
    error.value = null

    try {
      await service.importBackup(file)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Import failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const loadConfig = () => {
    try {
      config.value = service.getAutoBackupConfig()
    } catch {}
  }

  const updateConfig = async (newConfig: Partial<AutoBackupConfig>) => {
    try {
      const updatedConfig = { ...config.value, ...newConfig }
      service.setAutoBackupConfig(updatedConfig)
      config.value = updatedConfig
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Update failed'
      return false
    }
  }

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

  onMounted(() => {
    loadConfig()
  })

  return {
    isLoading,
    error,
    config,
    exportBackup,
    importBackup,
    loadConfig,
    updateConfig,
    formatDate,
  }
}
