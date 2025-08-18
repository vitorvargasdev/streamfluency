<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useVocabularyStore } from '../../stores/vocabulary'
import { usePlayerStore } from '../../stores/player'
import { useSettingStore } from '../../stores/setting'
import { translationService } from '../../services/translation/translation.service'
import type {
  DictionaryResult,
  TranslationResult,
} from '../../services/translation/types'

const vocabularyStore = useVocabularyStore()
const playerStore = usePlayerStore()
const settingStore = useSettingStore()

const isVisible = ref(false)
const selectedText = ref('')
const contextText = ref('')
const position = ref({ x: 0, y: 0 })
const popupRef = ref<HTMLDivElement>()
const isSaving = ref(false)
const isLoading = ref(false)
const dictionaryData = ref<DictionaryResult | null>(null)
const isSingleWord = ref(false)
const isTranslating = ref(false)
const translationData = ref<TranslationResult | null>(null)
const targetLanguage = ref('Português')

// Dragging state
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// Debounce timer
let showDebounceTimer: ReturnType<typeof setTimeout> | null = null

const alreadyExists = computed(() => {
  return vocabularyStore.checkIfExists(selectedText.value)
})

const popupStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
}))

const show = (text: string, context: string, x: number, y: number) => {
  // Clear any pending show timer
  if (showDebounceTimer) {
    clearTimeout(showDebounceTimer)
    showDebounceTimer = null
  }

  // If already visible with same text, don't reopen
  if (isVisible.value && selectedText.value === text) {
    return
  }

  // Hide existing popup immediately
  if (isVisible.value) {
    hide()
  }

  // Pause the video when selecting text
  try {
    playerStore.pause()
  } catch (error) {
    console.log('Could not pause video:', error)
  }

  // Debounce the show action
  showDebounceTimer = setTimeout(() => {
    selectedText.value = text
    contextText.value = context
    dictionaryData.value = null
    isSingleWord.value = translationService.isSingleWord(text)

    // Center horizontally, top of screen
    const popupWidth = 400
    const viewportWidth = window.innerWidth
    const topOffset = 80 // Distance from top of screen

    const centerX = (viewportWidth - popupWidth) / 2
    const topY = topOffset

    position.value = { x: centerX, y: topY }
    isVisible.value = true

    // Fetch dictionary definition
    isLoading.value = true
    translationService
      .getDefinition(text)
      .then((result) => {
        dictionaryData.value = result
      })
      .catch((error) => {
        console.error('Error fetching definition:', error)
      })
      .finally(() => {
        isLoading.value = false
      })

    // Fetch translation
    isTranslating.value = true
    translationData.value = null
    translationService
      .translate(text, 'en', settingStore.providers.targetLanguage)
      .then((result) => {
        translationData.value = result
      })
      .catch((error) => {
        console.error('Error fetching translation:', error)
      })
      .finally(() => {
        isTranslating.value = false
      })
  }, 100) // 100ms debounce
}

const hide = () => {
  // Clear any pending show timer
  if (showDebounceTimer) {
    clearTimeout(showDebounceTimer)
    showDebounceTimer = null
  }

  isVisible.value = false
  selectedText.value = ''
  contextText.value = ''
  isSaving.value = false
  isLoading.value = false
  dictionaryData.value = null
  isSingleWord.value = false
  isTranslating.value = false
  translationData.value = null
}

const handleSave = async () => {
  if (alreadyExists.value || isSaving.value) return

  try {
    isSaving.value = true

    const videoUrl = window.location.href
    const videoTitle = document.title
    const videoTimestamp = playerStore.currentTime()

    await vocabularyStore.addItem({
      text: selectedText.value,
      context: contextText.value,
      videoUrl,
      videoTitle,
      videoTimestamp,
      language: 'en',
    })

    setTimeout(() => {
      hide()
    }, 1000)
  } catch (error) {
    console.error('Failed to save vocabulary item:', error)
    isSaving.value = false
  }
}

const startDrag = (event: MouseEvent | TouchEvent) => {
  isDragging.value = true

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y,
  }

  // Prevent text selection while dragging
  event.preventDefault()
}

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return

  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const newX = clientX - dragOffset.value.x
  const newY = clientY - dragOffset.value.y

  // Keep popup within viewport bounds
  const popupWidth = popupRef.value?.offsetWidth || 400
  const popupHeight = popupRef.value?.offsetHeight || 300
  const maxX = window.innerWidth - popupWidth
  const maxY = window.innerHeight - popupHeight

  position.value = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY)),
  }
}

const stopDrag = () => {
  isDragging.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (popupRef.value && !popupRef.value.contains(event.target as Node)) {
    hide()
  }
}

const handleSelectionChange = () => {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) {
    return // Don't hide on deselection, user might be clicking save
  }

  const selectedString = selection.toString().trim()
  if (!selectedString) {
    return
  }

  const subtitleDisplay = document.querySelector('.subtitle-display')
  if (!subtitleDisplay) return

  const range = selection.getRangeAt(0)
  const container = range.commonAncestorContainer

  const isInSubtitle =
    subtitleDisplay.contains(container) || subtitleDisplay === container

  if (!isInSubtitle) {
    return
  }

  // Don't trigger if popup is already visible for this text
  if (isVisible.value && selectedText.value === selectedString) {
    return
  }

  const subtitleElement =
    container.nodeType === Node.TEXT_NODE
      ? container.parentElement?.closest('.subtitle-line')
      : (container as HTMLElement).closest('.subtitle-line')

  // Fix: Get context text properly, converting <br> to spaces
  let context = ''
  if (subtitleElement) {
    // Clone the element to avoid modifying the original
    const clone = subtitleElement.cloneNode(true) as HTMLElement
    // Replace all <br> tags with spaces
    clone.querySelectorAll('br').forEach((br) => {
      br.replaceWith(' ')
    })
    // Get the text content which now has spaces instead of <br>
    context = clone.textContent?.replace(/\s+/g, ' ').trim() || ''
  }

  const rect = range.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + window.scrollY

  show(selectedString, context, x, y)
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  document.addEventListener('selectionchange', handleSelectionChange)
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
  vocabularyStore.init()

  // Load settings from localStorage first
  settingStore.loadFromLocalStorage()

  // Initialize translation service with user's settings
  translationService.initWithSettings(
    settingStore.providers.translation,
    settingStore.providers.dictionary
  )

  // Update target language display
  const langNames: Record<string, string> = {
    pt: 'Português',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
    ru: 'Русский',
    ar: 'العربية',
  }
  targetLanguage.value =
    langNames[settingStore.providers.targetLanguage] || 'Português'
})

// Watch for settings changes and update translation service
watch(
  () => settingStore.providers,
  (newProviders) => {
    translationService.initWithSettings(
      newProviders.translation,
      newProviders.dictionary
    )

    const langNames: Record<string, string> = {
      pt: 'Português',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      ja: '日本語',
      ko: '한국어',
      zh: '中文',
      ru: 'Русский',
      ar: 'العربية',
    }
    targetLanguage.value = langNames[newProviders.targetLanguage] || 'Português'
  },
  { deep: true }
)

onUnmounted(() => {
  // Clear any pending timers
  if (showDebounceTimer) {
    clearTimeout(showDebounceTimer)
  }

  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('selectionchange', handleSelectionChange)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})

defineExpose({
  show,
  hide,
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      ref="popupRef"
      class="selection-popup"
      :class="{ dragging: isDragging }"
      :style="popupStyle"
      @mousedown.stop
    >
      <div class="popup-header" @mousedown="startDrag" @touchstart="startDrag">
        <div class="selected-text">{{ selectedText }}</div>
        <button class="close-btn" @click="hide" title="Fechar">×</button>
      </div>
      <div class="popup-content">
        <div v-if="translationData" class="translation-section">
          <div class="translation-label">Tradução ({{ targetLanguage }})</div>
          <div class="translation-text">
            {{ translationData.translatedText }}
          </div>
          <div class="translation-service">
            via {{ translationData.service }}
          </div>
        </div>

        <div v-else-if="isTranslating" class="loading">
          <span class="loading-spinner"></span>
          Traduzindo...
        </div>

        <div v-if="isLoading" class="loading">
          <span class="loading-spinner"></span>
          Buscando definição...
        </div>

        <div
          v-else-if="dictionaryData && dictionaryData.meanings.length > 0"
          class="dictionary-content"
        >
          <div v-if="dictionaryData.phonetic" class="phonetic">
            {{ dictionaryData.phonetic }}
          </div>

          <div class="definitions">
            <div
              v-for="(meaning, index) in dictionaryData.meanings.slice(0, 2)"
              :key="index"
              class="definition-item"
            >
              <span v-if="meaning.partOfSpeech" class="part-of-speech">{{
                meaning.partOfSpeech
              }}</span>
              <span class="definition">{{ meaning.definition }}</span>
              <span v-if="meaning.example" class="example"
                >"{{ meaning.example }}"</span
              >
            </div>
          </div>
        </div>

        <div v-else-if="!isLoading && !dictionaryData" class="no-definition">
          Nenhuma definição encontrada
        </div>

        <div class="actions">
          <button class="save-button" @click="handleSave" :disabled="isSaving">
            {{
              isSaving ? 'Salvando...' : alreadyExists ? 'Já salvo ✓' : 'Salvar'
            }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.selection-popup {
  position: fixed;
  z-index: 10000;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  &.dragging {
    cursor: move;
    user-select: none;
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.15),
      rgba(102, 126, 234, 0.05)
    );
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px 12px 0 0;
    cursor: move;
    user-select: none;

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(102, 126, 234, 0.2),
        rgba(102, 126, 234, 0.08)
      );
    }

    .selected-text {
      color: #667eea;
      font-size: 16px;
      font-weight: 600;
      word-break: break-word;
      flex: 1;
      margin-right: 10px;
    }

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      font-size: 24px;
      cursor: pointer;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
      flex-shrink: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  .popup-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex: 1;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;

    .loading-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }

  .dictionary-content {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .phonetic {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      font-style: italic;
      padding: 8px 12px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 8px;
      display: inline-block;
      align-self: flex-start;
      border: 1px solid rgba(102, 126, 234, 0.2);
    }

    .definitions {
      .definition-item {
        margin-bottom: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 8px;
        transition: all 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(2px);
        }

        .part-of-speech {
          display: inline-block;
          color: #667eea;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-right: 10px;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          background: rgba(102, 126, 234, 0.15);
          border-radius: 4px;
        }

        .definition {
          color: rgba(255, 255, 255, 0.95);
          font-size: 14px;
          line-height: 1.6;
          display: block;
          margin-top: 6px;
        }

        .example {
          display: block;
          color: rgba(255, 255, 255, 0.65);
          font-size: 13px;
          font-style: italic;
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
        }
      }
    }
  }

  .no-definition {
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    text-align: center;
    padding: 10px 0;
  }

  .translation-section {
    margin-bottom: 12px;
    padding: 12px;
    background: rgba(102, 126, 234, 0.08);
    border-radius: 8px;
    border: 1px solid rgba(102, 126, 234, 0.15);

    .translation-label {
      color: #667eea;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .translation-text {
      color: rgba(255, 255, 255, 0.95);
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 6px;
    }

    .translation-service {
      color: rgba(255, 255, 255, 0.4);
      font-size: 11px;
      font-style: italic;
    }
  }

  .actions {
    display: flex;
    justify-content: center;
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    margin: 0 -16px -16px;
    border-radius: 0 0 12px 12px;

    .save-button {
      background: rgba(102, 126, 234, 0.2);
      color: #8fa1f3;
      border: 1px solid rgba(102, 126, 234, 0.3);
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover:not(:disabled) {
        background: rgba(102, 126, 234, 0.25);
        border-color: rgba(102, 126, 234, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;

        &:not(.saving) {
          background: rgba(76, 175, 80, 0.15);
          color: rgba(76, 175, 80, 0.9);
          border-color: rgba(76, 175, 80, 0.3);
        }
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
