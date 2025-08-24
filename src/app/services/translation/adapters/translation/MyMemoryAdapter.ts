import type { ITranslationAdapter } from './ITranslationAdapter'
import type { TranslationResult } from '../../types'

export class MyMemoryAdapter implements ITranslationAdapter {
  id = 'mymemory'
  name = 'MyMemory'
  private readonly API_URL = 'https://api.mymemory.translated.net/get'

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}?q=test&langpair=en|pt`, {
        method: 'HEAD',
      })
      return response.ok
    } catch {
      return false
    }
  }

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult | null> {
    try {
      const langPair = `${sourceLang}|${targetLang}`
      const url = `${this.API_URL}?q=${encodeURIComponent(text)}&langpair=${langPair}`

      const response = await fetch(url)
      if (!response.ok) return null

      const data = await response.json()
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return {
          originalText: text,
          translatedText: data.responseData.translatedText,
          sourceLang,
          targetLang,
          service: this.name,
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  getSupportedLanguages(): string[] {
    return [
      'en',
      'pt',
      'es',
      'fr',
      'de',
      'it',
      'nl',
      'pl',
      'ru',
      'ja',
      'zh',
      'ko',
      'ar',
      'hi',
      'tr',
      'he',
      'sv',
      'da',
      'no',
      'fi',
    ]
  }
}
