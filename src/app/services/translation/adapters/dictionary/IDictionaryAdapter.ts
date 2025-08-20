import type { DictionaryResult } from '../../types'

export interface IDictionaryAdapter {
  id: string
  name: string
  isAvailable(): Promise<boolean>
  getDefinition(word: string): Promise<DictionaryResult | null>
  getSupportedLanguages(): string[]
}
