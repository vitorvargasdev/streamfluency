import type { Ref } from 'vue'
import type {
  DictionaryResult,
  TranslationResult,
} from '../../services/translation/types'
import type { VocabularyItem } from '../../stores/vocabulary/types'

export interface PopupPosition {
  x: number
  y: number
}

export interface PopupState {
  isVisible: Ref<boolean>
  selectedText: Ref<string>
  contextText: Ref<string>
  position: Ref<PopupPosition>
  isSaving: Ref<boolean>
  isSingleWord: Ref<boolean>
  showAllMeanings: Ref<boolean>
}

export interface PopupTranslationState {
  isLoading: Ref<boolean>
  isTranslating: Ref<boolean>
  isTranslatingContext: Ref<boolean>
  dictionaryData: Ref<DictionaryResult | null>
  translationData: Ref<TranslationResult | null>
  contextTranslationData: Ref<TranslationResult | null>
  translatedMeanings: Ref<
    Map<number, { definition?: string; example?: string }>
  >
  loadingTranslations: Ref<Set<number>>
  targetLanguage: Ref<string>
}

export interface PopupMethods {
  show: (text: string, context: string) => void
  hide: () => void
  handleSave: () => Promise<void>
  showVocabularyItem: (item: VocabularyItem) => void
  openFreeDictionary: () => void
}

export interface SelectionPopupProps {
  mode?: 'selection' | 'vocabulary'
}

export interface PopupConfig {
  DEBOUNCE: {
    SELECTION: number
    SHOW: number
  }
  DIMENSIONS: {
    WIDTH: number
    HEIGHT: number
    TOP_OFFSET: number
    TOP_OFFSET_VOCABULARY: number
  }
  ANIMATION: {
    HIDE_DELAY: number
    CLICK_OUTSIDE_DELAY: number
  }
}
