export interface VocabularyItem {
  id: string
  text: string
  context?: string
  translation?: string
  notes?: string
  timestamp: number
  videoUrl?: string
  videoTitle?: string
  videoTimestamp?: number
  language?: string
}

export interface VocabularyState {
  items: VocabularyItem[]
  isLoading: boolean
  error: string | null
}
