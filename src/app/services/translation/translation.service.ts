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

  isSingleWord(text: string): boolean {
    return text.trim().split(/\s+/).length === 1
  }

  async getDefinition(text: string): Promise<DictionaryResult | null> {
    if (!this.dictionaryAdapter) {
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

  async translate(
    text: string,
    sourceLang: string = 'en',
    targetLang: string = 'pt'
  ): Promise<TranslationResult | null> {
    if (!this.translationAdapter) {
      this.translationAdapter = TranslationAdapterFactory.getAdapter('mymemory')
    }

    if (!this.translationAdapter) return null

    const result = await this.translationAdapter.translate(
      text,
      sourceLang,
      targetLang
    )
    if (result) {
      result.service = this.translationAdapter.name
      return result
    }

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

  initWithSettings(
    translationProvider: string,
    dictionaryProvider: string
  ): void {
    this.setTranslationProvider(translationProvider)
    this.setDictionaryProvider(dictionaryProvider)
  }
}

export const translationService = new TranslationServiceImpl()
