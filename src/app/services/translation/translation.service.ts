import type { DictionaryResult, TranslationResult } from './types'
import { TranslationAdapterFactory } from './factories/TranslationAdapterFactory'
import { DictionaryAdapterFactory } from './factories/DictionaryAdapterFactory'
import type { ITranslationAdapter } from './adapters/translation/ITranslationAdapter'
import type { IDictionaryAdapter } from './adapters/dictionary/IDictionaryAdapter'

class TranslationServiceImpl {
  private translationAdapter: ITranslationAdapter | null = null
  private dictionaryAdapter: IDictionaryAdapter | null = null

  setTranslationProvider(providerId: string): void {
    this.translationAdapter = TranslationAdapterFactory.getAdapter(providerId)
  }

  setDictionaryProvider(providerId: string): void {
    this.dictionaryAdapter = DictionaryAdapterFactory.getAdapter(providerId)
  }

  // Helper method to detect if text is a single word or phrase
  isSingleWord(text: string): boolean {
    return text.trim().split(/\s+/).length === 1
  }

  // Get dictionary definition using the selected adapter
  async getDefinition(text: string): Promise<DictionaryResult | null> {
    if (!this.dictionaryAdapter) {
      // Fallback to default if not set
      this.dictionaryAdapter =
        DictionaryAdapterFactory.getAdapter('freedictionary')
    }

    if (!this.dictionaryAdapter) {
      return {
        word: text,
        meanings: [],
        error: 'No dictionary provider available',
      }
    }

    return await this.dictionaryAdapter.getDefinition(text)
  }

  // Translate text using the selected adapter
  async translate(
    text: string,
    sourceLang: string = 'en',
    targetLang: string = 'pt'
  ): Promise<TranslationResult | null> {
    if (!this.translationAdapter) {
      // Fallback to default if not set
      this.translationAdapter = TranslationAdapterFactory.getAdapter('mymemory')
    }

    if (!this.translationAdapter) {
      return null
    }

    // Try primary adapter
    const result = await this.translationAdapter.translate(
      text,
      sourceLang,
      targetLang
    )
    if (result) {
      // Ensure the service name is set correctly (not showing fallback for primary)
      result.service = this.translationAdapter.name
      return result
    }

    // If primary fails, try fallback adapters
    const allAdapters = TranslationAdapterFactory.getAllAdapters()
    for (const adapter of allAdapters) {
      if (adapter.id !== this.translationAdapter.id) {
        const fallbackResult = await adapter.translate(
          text,
          sourceLang,
          targetLang
        )
        if (fallbackResult) {
          fallbackResult.service = `${adapter.name} (fallback)`
          return fallbackResult
        }
      }
    }

    return null
  }

  // Initialize with settings from store
  initWithSettings(
    translationProvider: string,
    dictionaryProvider: string
  ): void {
    this.setTranslationProvider(translationProvider)
    this.setDictionaryProvider(dictionaryProvider)
  }
}

export const translationService = new TranslationServiceImpl()
