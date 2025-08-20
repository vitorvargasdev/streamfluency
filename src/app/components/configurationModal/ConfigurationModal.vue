<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingStore } from '@/app/stores/setting'
import { TranslationAdapterFactory } from '@/app/services/translation/factories/TranslationAdapterFactory'
import { DictionaryAdapterFactory } from '@/app/services/translation/factories/DictionaryAdapterFactory'
import { BackupService } from '../../services/backup'
import type { AutoBackupConfig } from '../../services/backup'
import GenericModal from '../genericModal/GenericModal.vue'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'

const emit = defineEmits<{
  close: []
}>()

const settingStore = useSettingStore()
const backupService = BackupService.getInstance()
const isVisible = ref(false)
const activeTab = ref<'languages' | 'providers' | 'backup' | 'keyboard'>(
  'languages'
)

// Language settings
const selectedNative = ref(settingStore.nativeLanguage)
const selectedLearning = ref(settingStore.learningLanguage)
const languageErrorMessage = ref('')
const isLanguageLoading = ref(false)

const languageLabels = {
  [GLOBAL_LANGUAGES.EN]: 'Inglês',
  [GLOBAL_LANGUAGES.ES]: 'Espanhol',
  [GLOBAL_LANGUAGES.PTBR]: 'Português (BR)',
  [GLOBAL_LANGUAGES.JA]: 'Japonês',
}

const availableLanguages = computed(() => [
  GLOBAL_LANGUAGES.EN,
  GLOBAL_LANGUAGES.ES,
  GLOBAL_LANGUAGES.PTBR,
  GLOBAL_LANGUAGES.JA,
])

// Provider selections
const selectedTranslation = ref('')
const selectedDictionary = ref('')
const targetLanguage = ref('')

// Backup refs
const fileInput = ref<HTMLInputElement>()
const autoBackupEnabled = ref(false)
const autoDownload = ref(true)
const backupFrequency = ref<'hourly' | 'daily' | 'weekly'>('daily')
const maxBackups = ref(7)

// Keyboard refs
const arrowKeyNavigationEnabled = ref(false)

// Available providers
const translationProviders = computed(() =>
  TranslationAdapterFactory.getAvailableAdapters()
)
const dictionaryProviders = computed(() =>
  DictionaryAdapterFactory.getAvailableAdapters()
)

// Language change handler
const onLanguageChange = async () => {
  if (selectedNative.value === selectedLearning.value) {
    languageErrorMessage.value = 'Os idiomas devem ser diferentes'
    return
  }

  isLanguageLoading.value = true
  languageErrorMessage.value = ''

  try {
    await settingStore.setLanguages(
      selectedNative.value,
      selectedLearning.value
    )
  } catch (error) {
    languageErrorMessage.value = 'Erro ao carregar legendas'
  } finally {
    isLanguageLoading.value = false
  }
}

// Provider event handlers
const onTranslationChange = () => {
  settingStore.setTranslationProvider(selectedTranslation.value)
}

const onDictionaryChange = () => {
  settingStore.setDictionaryProvider(selectedDictionary.value)
}

const onTargetLanguageChange = () => {
  settingStore.setTargetLanguage(targetLanguage.value)
}

// Backup functions
const exportBackup = async () => {
  try {
    await backupService.downloadBackup(false) // manual backup
    alert('Backup exportado com sucesso!')
  } catch (error) {
    console.error('Failed to export backup:', error)
    alert('Erro ao exportar backup')
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    try {
      await backupService.importBackup(file)
      alert('Backup importado com sucesso! As configurações foram restauradas.')
      loadSettings()
      target.value = ''
    } catch (error) {
      console.error('Failed to import backup:', error)
      alert('Erro ao importar backup. Verifique se o arquivo é válido.')
      target.value = ''
    }
  }
}

const updateBackupConfig = () => {
  const config: AutoBackupConfig = {
    enabled: autoBackupEnabled.value,
    frequency: backupFrequency.value,
    maxBackups: maxBackups.value,
    autoDownload: autoDownload.value,
  }
  backupService.setAutoBackupConfig(config)
}

const onAutoBackupToggle = () => updateBackupConfig()
const onBackupFrequencyChange = () => updateBackupConfig()
const onMaxBackupsChange = () => updateBackupConfig()

const onArrowKeyNavigationToggle = () => {
  settingStore.toggleArrowKeyNavigation()
}

const loadSettings = () => {
  // Load language settings
  selectedNative.value = settingStore.nativeLanguage
  selectedLearning.value = settingStore.learningLanguage

  // Load provider settings
  selectedTranslation.value = settingStore.providers.translation
  selectedDictionary.value = settingStore.providers.dictionary
  targetLanguage.value = settingStore.providers.targetLanguage

  // Load backup settings
  const backupConfig = backupService.getAutoBackupConfig()
  autoBackupEnabled.value = backupConfig.enabled
  backupFrequency.value = backupConfig.frequency
  maxBackups.value = backupConfig.maxBackups
  autoDownload.value = backupConfig.autoDownload

  // Load keyboard settings
  arrowKeyNavigationEnabled.value = settingStore.isArrowKeyNavigationEnabled
}

const show = () => {
  loadSettings()
  isVisible.value = true
}

const closeModal = () => {
  isVisible.value = false
  emit('close')
}

onMounted(() => {
  loadSettings()
  // Auto-backup is already initialized in main.ts
})

defineExpose({
  show,
})
</script>

<template>
  <GenericModal
    v-model="isVisible"
    title="Configurações"
    size="medium"
    :show-cancel-button="false"
    confirm="Fechar"
    @confirm="closeModal"
  >
    <template #body>
      <!-- Tabs Navigation -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'languages' }"
          @click="activeTab = 'languages'"
        >
          Idiomas
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'providers' }"
          @click="activeTab = 'providers'"
        >
          Provedores
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'backup' }"
          @click="activeTab = 'backup'"
        >
          Backup
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'keyboard' }"
          @click="activeTab = 'keyboard'"
        >
          Teclado
        </button>
      </div>

      <!-- Languages Tab Content -->
      <div v-if="activeTab === 'languages'" class="tab-content">
        <div class="config-section">
          <h3 class="section-title">Configuração de Idiomas</h3>

          <div class="language-selector">
            <div class="language-selector__group">
              <label class="streamfluency-select-label">Idioma Nativo:</label>
              <select
                class="streamfluency-select"
                v-model="selectedNative"
                @change="onLanguageChange"
                :disabled="isLanguageLoading"
              >
                <option
                  v-for="lang in availableLanguages"
                  :key="lang"
                  :value="lang"
                >
                  {{ languageLabels[lang] }}
                </option>
              </select>
            </div>

            <div class="language-selector__group">
              <label class="streamfluency-select-label">Aprendendo:</label>
              <select
                class="streamfluency-select"
                v-model="selectedLearning"
                @change="onLanguageChange"
                :disabled="isLanguageLoading"
              >
                <option
                  v-for="lang in availableLanguages"
                  :key="lang"
                  :value="lang"
                >
                  {{ languageLabels[lang] }}
                </option>
              </select>
            </div>

            <div v-if="languageErrorMessage" class="language-selector__error">
              {{ languageErrorMessage }}
            </div>

            <div v-if="isLanguageLoading" class="language-selector__loading">
              Carregando legendas...
            </div>
          </div>
        </div>

        <!-- Info Section -->
        <div class="info-section">
          <p class="info-text">
            Selecione seu idioma nativo e o idioma que está aprendendo. As
            legendas serão carregadas automaticamente quando disponíveis.
          </p>
        </div>
      </div>

      <!-- Providers Tab Content -->
      <div v-if="activeTab === 'providers'" class="tab-content">
        <!-- Translation Provider Section -->
        <div class="config-section">
          <label class="streamfluency-select-label">Serviço de Tradução</label>
          <select
            class="streamfluency-select"
            v-model="selectedTranslation"
            @change="onTranslationChange"
          >
            <option
              v-for="provider in translationProviders"
              :key="provider.id"
              :value="provider.id"
            >
              {{ provider.name }}
            </option>
          </select>
          <p class="config-note" v-if="translationProviders.length === 1">
            Mais provedores de tradução serão adicionados em breve.
          </p>
        </div>

        <!-- Dictionary Provider Section -->
        <div class="config-section">
          <label class="streamfluency-select-label"
            >Serviço de Dicionário</label
          >
          <select
            class="streamfluency-select"
            v-model="selectedDictionary"
            @change="onDictionaryChange"
          >
            <option
              v-for="provider in dictionaryProviders"
              :key="provider.id"
              :value="provider.id"
            >
              {{ provider.name }}
            </option>
          </select>
        </div>

        <!-- Target Language Section -->
        <div class="config-section">
          <label class="streamfluency-select-label">Idioma de Tradução</label>
          <select
            class="streamfluency-select"
            v-model="targetLanguage"
            @change="onTargetLanguageChange"
          >
            <option value="pt">Português</option>
            <option value="es">Espanhol</option>
            <option value="fr">Francês</option>
            <option value="de">Alemão</option>
            <option value="it">Italiano</option>
            <option value="ja">Japonês</option>
            <option value="ko">Coreano</option>
            <option value="zh">Chinês</option>
            <option value="ru">Russo</option>
            <option value="ar">Árabe</option>
          </select>
        </div>

        <!-- Info Section -->
        <div class="info-section">
          <p class="info-text">
            As configurações são salvas automaticamente e aplicadas
            imediatamente.
          </p>
        </div>
      </div>

      <!-- Backup Tab Content -->
      <div v-if="activeTab === 'backup'" class="tab-content">
        <!-- Manual Backup Section -->
        <div class="config-section">
          <h3 class="section-title">Backup Manual</h3>

          <div class="backup-actions">
            <button class="action-button primary" @click="exportBackup">
              Exportar Backup
            </button>

            <div class="import-wrapper">
              <input
                type="file"
                ref="fileInput"
                accept=".json"
                @change="handleFileSelect"
                style="display: none"
              />
              <button class="action-button" @click="triggerFileInput">
                Importar Backup
              </button>
            </div>
          </div>

          <p class="config-note">
            Exporta ou importa todas as suas palavras salvas e configurações.
          </p>
        </div>

        <!-- Auto Backup Section -->
        <div class="config-section">
          <h3 class="section-title">Backup Automático</h3>

          <div class="auto-backup-toggle">
            <label class="toggle-label">
              <input
                type="checkbox"
                v-model="autoBackupEnabled"
                @change="onAutoBackupToggle"
              />
              <span>Ativar backup automático</span>
            </label>
          </div>

          <div v-if="autoBackupEnabled" class="auto-backup-settings">
            <div class="setting-row">
              <label class="streamfluency-select-label">Frequência</label>
              <select
                class="streamfluency-select"
                v-model="backupFrequency"
                @change="onBackupFrequencyChange"
              >
                <option value="hourly">A cada hora</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
              </select>
            </div>

            <div class="setting-row">
              <label class="streamfluency-select-label"
                >Máximo de backups</label
              >
              <select
                class="streamfluency-select"
                v-model="maxBackups"
                @change="onMaxBackupsChange"
              >
                <option value="3">3 backups</option>
                <option value="5">5 backups</option>
                <option value="7">7 backups</option>
                <option value="10">10 backups</option>
                <option value="15">15 backups</option>
              </select>
            </div>

            <div class="setting-row">
              <label class="toggle-label">
                <input
                  type="checkbox"
                  v-model="autoDownload"
                  @change="onAutoBackupToggle"
                />
                <span>Baixar automaticamente para pasta Downloads</span>
              </label>
              <p class="config-note">
                Os backups automáticos serão salvos em
                Downloads/streamfluency-backups-auto/
              </p>
            </div>
          </div>
        </div>

        <!-- Info Section -->
        <div class="info-section">
          <p class="info-text">
            O backup automático salva suas palavras e configurações
            periodicamente. Backups manuais: Downloads/streamfluency-backups/
            Backups automáticos: Downloads/streamfluency-backups-auto/
          </p>
        </div>
      </div>

      <!-- Keyboard Tab Content -->
      <div v-if="activeTab === 'keyboard'" class="tab-content">
        <div class="config-section">
          <h3 class="section-title">Atalhos de Teclado</h3>

          <div class="keyboard-setting">
            <label class="toggle-label">
              <input
                type="checkbox"
                v-model="arrowKeyNavigationEnabled"
                @change="onArrowKeyNavigationToggle"
              />
              <span>Navegação com setas do teclado</span>
            </label>
            <p class="config-note">
              Use as setas ← → para navegar entre legendas anteriores e próximas
            </p>
          </div>

          <div class="shortcuts-info">
            <h4>Atalhos disponíveis:</h4>
            <ul class="shortcuts-list">
              <li v-if="arrowKeyNavigationEnabled">
                <kbd>←</kbd> Legenda anterior
              </li>
              <li v-if="arrowKeyNavigationEnabled">
                <kbd>→</kbd> Próxima legenda
              </li>
            </ul>
            <p class="config-note" v-if="!arrowKeyNavigationEnabled">
              Ative a navegação com setas para ver os atalhos disponíveis
            </p>
          </div>
        </div>

        <!-- Info Section -->
        <div class="info-section">
          <p class="info-text">
            Os atalhos de teclado permitem navegar rapidamente entre as
            legendas. As configurações são salvas automaticamente.
          </p>
        </div>
      </div>
    </template>
  </GenericModal>
</template>

<style scoped lang="scss">
@use '../../assets/scss/components/select';

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .tab {
    padding: 10px 20px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      color: rgba(255, 255, 255, 0.9);
    }

    &.active {
      color: #667eea;

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: #667eea;
      }
    }
  }
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.config-section {
  margin-bottom: 28px;

  .section-title {
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px 0;
  }

  .config-note {
    margin-top: 8px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-style: italic;
  }
}

.backup-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;

  .action-button {
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }

    &.primary {
      background: rgba(102, 126, 234, 0.2);
      border-color: #667eea;
      color: #667eea;

      &:hover {
        background: rgba(102, 126, 234, 0.3);
      }
    }
  }
}

.import-wrapper {
  display: inline-block;
}

.auto-backup-toggle {
  margin-bottom: 16px;

  .toggle-label {
    display: flex;
    align-items: center;
    cursor: pointer;

    input[type='checkbox'] {
      margin-right: 8px;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    span {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
    }
  }
}

.auto-backup-settings {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  .setting-row {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.mt-2 {
  margin-top: 16px;
}

.info-section {
  margin-top: 32px;
  padding: 16px;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.15);

  .info-text {
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    line-height: 1.6;
    margin: 0;
  }
}

.keyboard-setting {
  margin-bottom: 20px;

  .toggle-label {
    display: flex;
    align-items: center;
    cursor: pointer;

    input[type='checkbox'] {
      margin-right: 8px;
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    span {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
    }
  }
}

.language-selector {
  &__group {
    margin-bottom: 20px;
  }

  &__error {
    color: #ff6b6b;
    font-size: 14px;
    margin-top: 10px;
    padding: 8px;
    background: rgba(255, 107, 107, 0.1);
    border-radius: 4px;
    text-align: center;
  }

  &__loading {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin-top: 10px;
    text-align: center;
    opacity: 0.8;
  }
}

.shortcuts-info {
  margin-top: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  h4 {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px 0;
  }

  .shortcuts-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      color: rgba(255, 255, 255, 0.7);
      font-size: 13px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      kbd {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 2px 8px;
        font-family: monospace;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.9);
        min-width: 24px;
        text-align: center;
      }
    }
  }
}
</style>
