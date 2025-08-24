import { ref, Ref } from 'vue'
import { translationService } from '../services/translation/translation.service'
import { useSettingStore } from '../stores/setting'
import type {
  DictionaryResult,
  TranslationResult,
  DictionaryDefinition,
} from '../services/translation/types'

export interface TranslationState {
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
  translateText: (text: string) => Promise<void>
  translateContext: (context: string) => Promise<void>
  translateMeaning: (
    index: number,
    meaning: DictionaryDefinition
  ) => Promise<void>
  fetchDefinition: (text: string) => Promise<void>
  resetTranslations: () => void
}

export function usePopupTranslation(): TranslationState {
  const settingStore = useSettingStore()

  const isLoading = ref(false)
  const isTranslating = ref(false)
  const isTranslatingContext = ref(false)
  const dictionaryData = ref<DictionaryResult | null>(null)
  const translationData = ref<TranslationResult | null>(null)
  const contextTranslationData = ref<TranslationResult | null>(null)
  const translatedMeanings = ref<
    Map<number, { definition?: string; example?: string }>
  >(new Map())
  const loadingTranslations = ref<Set<number>>(new Set())

  const fetchDefinition = async (text: string) => {
    isLoading.value = true
    dictionaryData.value = null

    try {
      const result = await translationService.getDefinition(text)
      dictionaryData.value = result
    } catch {
    } finally {
      isLoading.value = false
    }
  }

  const translateText = async (text: string) => {
    isTranslating.value = true
    translationData.value = null

    try {
      const result = await translationService.translate(
        text,
        'en',
        settingStore.providers.targetLanguage
      )
      translationData.value = result
    } catch {
    } finally {
      isTranslating.value = false
    }
  }

  const translateContext = async (context: string) => {
    if (!context || isTranslatingContext.value) return

    isTranslatingContext.value = true
    try {
      const result = await translationService.translate(
        context,
        'en',
        settingStore.providers.targetLanguage
      )
      contextTranslationData.value = result
    } catch {
    } finally {
      isTranslatingContext.value = false
    }
  }

  const translateMeaning = async (
    index: number,
    meaning: DictionaryDefinition
  ) => {
    if (loadingTranslations.value.has(index)) return

    loadingTranslations.value.add(index)

    try {
      const definitionResult = await translationService.translate(
        meaning.definition,
        'en',
        settingStore.providers.targetLanguage
      )

      let exampleResult = null
      if (meaning.example) {
        exampleResult = await translationService.translate(
          meaning.example,
          'en',
          settingStore.providers.targetLanguage
        )
      }

      translatedMeanings.value.set(index, {
        definition: definitionResult?.translatedText,
        example: exampleResult?.translatedText,
      })
    } catch {
    } finally {
      loadingTranslations.value.delete(index)
    }
  }

  const resetTranslations = () => {
    isLoading.value = false
    isTranslating.value = false
    isTranslatingContext.value = false
    dictionaryData.value = null
    translationData.value = null
    contextTranslationData.value = null
    translatedMeanings.value.clear()
    loadingTranslations.value.clear()
  }

  return {
    isLoading,
    isTranslating,
    isTranslatingContext,
    dictionaryData,
    translationData,
    contextTranslationData,
    translatedMeanings,
    loadingTranslations,
    translateText,
    translateContext,
    translateMeaning,
    fetchDefinition,
    resetTranslations,
  }
}
