import type { IDictionaryAdapter } from './IDictionaryAdapter'
import type { DictionaryResult, DictionaryDefinition } from '../../types'

export class FreeDictionaryAdapter implements IDictionaryAdapter {
  id = 'freedictionary'
  name = 'The Free Dictionary'
  private readonly API_URL = 'https://api.dictionaryapi.dev/api/v2/entries'

  async isAvailable(): Promise<boolean> {
    try {
      await fetch(`${this.API_URL}/en/test`, { method: 'HEAD' })
      return true // API returns 404 for non-existent words, but is still available
    } catch {
      return false
    }
  }

  async getDefinition(word: string): Promise<DictionaryResult | null> {
    const trimmedWord = word.trim().toLowerCase()

    // Try different formats for compound words
    const formats = trimmedWord.includes(' ')
      ? [
          trimmedWord,
          trimmedWord.replace(/\s+/g, '-'),
          trimmedWord.replace(/\s+/g, ''),
          trimmedWord.replace(/\s+/g, '_'),
        ]
      : [trimmedWord]

    for (const format of formats) {
      const result = await this.fetchDefinition(format)
      if (result && result.meanings.length > 0) {
        result.word = word.trim() // Keep original text
        return result
      }
    }

    return {
      word,
      meanings: [],
      error: 'No definitions found',
    }
  }

  private async fetchDefinition(
    word: string
  ): Promise<DictionaryResult | null> {
    try {
      const response = await fetch(
        `${this.API_URL}/en/${encodeURIComponent(word)}`
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Dictionary API error: ${response.status}`)
      }

      const data = await response.json()
      if (!data || !data[0]) {
        return null
      }

      const entry = data[0]
      const meanings: DictionaryDefinition[] = []

      if (entry.meanings) {
        for (const meaning of entry.meanings) {
          if (meaning.definitions) {
            for (const def of meaning.definitions) {
              meanings.push({
                partOfSpeech: meaning.partOfSpeech,
                definition: def.definition,
                example: def.example,
                synonyms: def.synonyms,
              })
            }
          }
        }
      }

      return {
        word: entry.word || word,
        phonetic: entry.phonetic,
        audio: entry.phonetics?.[0]?.audio,
        meanings: meanings.slice(0, 3), // Limit to 3 definitions
      }
    } catch (error) {
      console.error('FreeDictionary API error:', error)
      return null
    }
  }

  getSupportedLanguages(): string[] {
    return ['en'] // Free Dictionary API primarily supports English
  }
}
