import type { TranslationResult } from '../../types'

export interface ITranslationAdapter {
  id: string
  name: string
  isAvailable(): Promise<boolean>
  translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult | null>
  getSupportedLanguages(): string[]
}
