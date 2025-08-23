import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'
import { usePlayerStore } from '../stores/player'
import { useSettingStore } from '../stores/setting'
import { translationService } from '../services/translation/translation.service'
import { usePopupDragging } from './usePopupDragging'
import { usePopupTranslation } from './usePopupTranslation'
import { useTextSelection } from './useTextSelection'
import {
  POPUP_CONFIG,
  LANGUAGE_NAMES,
  CSS_SELECTORS,
} from '../components/selectionPopup/constants'
import type { VocabularyItem } from '../stores/vocabulary/types'
import type { SelectionPopupProps } from '../components/selectionPopup/types'

export function useSelectionPopup(options: SelectionPopupProps = {}) {
  const vocabularyStore = useVocabularyStore()
  const playerStore = usePlayerStore()
  const settingStore = useSettingStore()

  const instanceId = Math.random().toString(36).substring(2, 11)

  let showDebounceTimer: ReturnType<typeof setTimeout> | null = null

  const isVisible = ref(false)
  const selectedText = ref('')
  const contextText = ref('')
  const isSaving = ref(false)
  const isSingleWord = ref(false)
  const showAllMeanings = ref(false)
  const targetLanguage = ref('Português')

  const {
    isDragging,
    position,
    startDrag,
    setupDragListeners,
    cleanupDragListeners,
  } = usePopupDragging()

  const {
    isLoading,
    isTranslating,
    isTranslatingContext,
    dictionaryData,
    translationData,
    contextTranslationData,
    translatedMeanings,
    loadingTranslations,
    translateText,
    translateContext: translateContextText,
    translateMeaning,
    fetchDefinition,
    resetTranslations,
  } = usePopupTranslation()

  const alreadyExists = computed(() => {
    return options.mode === 'vocabulary'
      ? true
      : vocabularyStore.checkIfExists(selectedText.value, contextText.value)
  })

  const popupStyle = computed(() => ({
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
  }))

  const calculatePopupPosition = (isVocabularyMode = false) => {
    const viewportWidth = window.innerWidth
    const topOffset = isVocabularyMode
      ? POPUP_CONFIG.DIMENSIONS.TOP_OFFSET_VOCABULARY
      : POPUP_CONFIG.DIMENSIONS.TOP_OFFSET

    return {
      x: (viewportWidth - POPUP_CONFIG.DIMENSIONS.WIDTH) / 2,
      y: topOffset,
    }
  }

  const show = (text: string, context: string) => {
    if (showDebounceTimer) {
      clearTimeout(showDebounceTimer)
      showDebounceTimer = null
    }

    if (isVisible.value && selectedText.value === text) return
    if (isVisible.value && selectedText.value !== text) hide()

    try {
      playerStore.pause()
    } catch (error) {
      console.log('Could not pause video:', error)
    }

    showDebounceTimer = setTimeout(() => {
      selectedText.value = text
      contextText.value = context
      isSingleWord.value = translationService.isSingleWord(text)

      position.value = calculatePopupPosition()
      isVisible.value = true

      fetchDefinition(text)
      translateText(text)
    }, POPUP_CONFIG.DEBOUNCE.SHOW)
  }

  const hide = () => {
    if (showDebounceTimer) {
      clearTimeout(showDebounceTimer)
      showDebounceTimer = null
    }

    if (!isVisible.value) return

    isVisible.value = false
    selectedText.value = ''
    contextText.value = ''
    isSaving.value = false
    isSingleWord.value = false
    showAllMeanings.value = false

    resetTranslations()
    window.getSelection()?.removeAllRanges()
  }

  const handleSave = async () => {
    if (alreadyExists.value || isSaving.value) return

    try {
      isSaving.value = true

      await vocabularyStore.addItem({
        text: selectedText.value,
        context: contextText.value,
        videoUrl: window.location.href,
        videoTitle: document.title,
        videoTimestamp: playerStore.currentTime(),
        language: 'en',
      })

      setTimeout(hide, POPUP_CONFIG.ANIMATION.HIDE_DELAY)
    } catch (error) {
      console.error('Failed to save vocabulary item:', error)
      isSaving.value = false
    }
  }

  const showVocabularyItem = (item: VocabularyItem) => {
    selectedText.value = item.text
    contextText.value = item.context || ''
    isSingleWord.value = translationService.isSingleWord(item.text)

    position.value = calculatePopupPosition(true)
    isVisible.value = true

    fetchDefinition(item.text)
    translateText(item.text)
  }

  const translateContext = async () => {
    await translateContextText(contextText.value)
  }

  const openFreeDictionary = () => {
    if (
      settingStore.providers.dictionary === 'freedictionary' &&
      selectedText.value
    ) {
      const url = `https://www.thefreedictionary.com/${encodeURIComponent(selectedText.value)}`
      window.open(url, '_blank')
    }
  }

  const handleClickOutside = (
    event: MouseEvent,
    popupElement?: HTMLElement
  ) => {
    if (popupElement?.contains(event.target as Node)) return

    const target = event.target as HTMLElement
    const isSubtitleClick = target.closest(CSS_SELECTORS.SUBTITLE_DISPLAY)

    if (isSubtitleClick) {
      setTimeout(() => {
        const selection = window.getSelection()
        if (
          !selection ||
          selection.isCollapsed ||
          !selection.toString().trim()
        ) {
          hide()
        }
      }, POPUP_CONFIG.ANIMATION.CLICK_OUTSIDE_DELAY)
    } else {
      hide()
    }
  }

  const { setupSelectionListener, cleanupSelectionListener } = useTextSelection(
    instanceId,
    options.mode,
    { onTextSelected: show }
  )

  onMounted(() => {
    setupSelectionListener()
    setupDragListeners()

    vocabularyStore.init()
    settingStore.loadFromLocalStorage()

    translationService.initWithSettings(
      settingStore.providers.translation,
      settingStore.providers.dictionary
    )

    targetLanguage.value =
      LANGUAGE_NAMES[settingStore.providers.targetLanguage] || 'Português'
  })

  watch(
    () => settingStore.providers,
    (newProviders) => {
      translationService.initWithSettings(
        newProviders.translation,
        newProviders.dictionary
      )
      targetLanguage.value =
        LANGUAGE_NAMES[newProviders.targetLanguage] || 'Português'
    },
    { deep: true }
  )

  onUnmounted(() => {
    if (showDebounceTimer) clearTimeout(showDebounceTimer)
    cleanupSelectionListener()
    cleanupDragListeners()
  })

  return {
    isVisible,
    selectedText,
    contextText,
    position,
    isSaving,
    isLoading,
    dictionaryData,
    isSingleWord,
    isTranslating,
    translationData,
    targetLanguage,
    isTranslatingContext,
    contextTranslationData,
    translatedMeanings,
    loadingTranslations,
    showAllMeanings,
    isDragging,
    alreadyExists,
    popupStyle,
    show,
    hide,
    handleSave,
    showVocabularyItem,
    translateContext,
    translateMeaning,
    openFreeDictionary,
    startDrag,
    handleClickOutside,
  }
}
