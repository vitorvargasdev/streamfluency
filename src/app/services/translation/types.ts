export interface DictionaryDefinition {
  partOfSpeech?: string
  definition: string
  example?: string
  synonyms?: string[]
}

export interface DictionaryResult {
  word: string
  phonetic?: string
  audio?: string
  meanings: DictionaryDefinition[]
  error?: string
}

export interface TranslationResult {
  originalText?: string
  translatedText: string
  sourceLang?: string
  targetLang: string
  service?: string
  error?: string
}

export interface TranslationService {
  getDictionaryDefinition(word: string): Promise<DictionaryResult>
  translate(
    text: string,
    targetLang: string,
    sourceLang?: string
  ): Promise<TranslationResult>
}
