import type { VocabularyItem } from '../../stores/vocabulary/types'
import { DATE_FILTERS, SORT_OPTIONS } from './constants'

export type DateFilter = DATE_FILTERS
export type SortOption = SORT_OPTIONS

export interface FilterState {
  searchQuery: string
  dateFilter: DateFilter
  sortBy: SortOption
  videoFilter: string
}

export interface EditState {
  editingId: string | null
  editingTranslation: string
  editingNotes: string
  editingContext: string
}

export interface VocabularyModalProps {
  isVisible: boolean
}

export interface VocabularyModalEmits {
  'update:isVisible': [value: boolean]
  close: []
}

export interface VocabularyItemActions {
  onEdit: (item: VocabularyItem) => void
  onSave: (id: string) => Promise<void>
  onCancel: () => void
  onDelete: (id: string) => Promise<void>
  onVideoClick: (item: VocabularyItem, event: Event) => void
  onShowDetails: (item: VocabularyItem) => void
}

export interface DateFormatResult {
  label: string
  isRecent: boolean
}
