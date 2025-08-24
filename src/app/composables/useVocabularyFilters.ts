import { ref, computed } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'
import {
  DATE_FILTERS,
  SORT_OPTIONS,
  TIME_PERIODS,
} from '../components/vocabularyModal/constants'
import type {
  DateFilter,
  SortOption,
  FilterState,
} from '../components/vocabularyModal/types'
import type { VocabularyItem } from '../stores/vocabulary/types'

export function useVocabularyFilters() {
  const vocabularyStore = useVocabularyStore()

  const searchQuery = ref('')
  const dateFilter = ref<DateFilter>(DATE_FILTERS.ALL)
  const sortBy = ref<SortOption>(SORT_OPTIONS.RECENT)
  const videoFilter = ref('all')

  const uniqueVideos = computed(() => {
    const videoMap = new Map<string, number>()

    vocabularyStore.items.forEach((item) => {
      if (!item.videoTitle) return

      const existing = videoMap.get(item.videoTitle)
      if (!existing || item.timestamp > existing) {
        videoMap.set(item.videoTitle, item.timestamp)
      }
    })

    return Array.from(videoMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([title]) => title)
  })

  const applyDateFilter = (items: VocabularyItem[]): VocabularyItem[] => {
    if (dateFilter.value === DATE_FILTERS.ALL) return items

    const now = Date.now()
    return items.filter((item) => {
      const age = now - item.timestamp

      if (dateFilter.value === DATE_FILTERS.TODAY) {
        return age < TIME_PERIODS.DAY
      }

      if (dateFilter.value === DATE_FILTERS.WEEK) {
        return age < TIME_PERIODS.WEEK
      }

      if (dateFilter.value === DATE_FILTERS.MONTH) {
        return age < TIME_PERIODS.MONTH
      }

      return true
    })
  }

  const applySearchFilter = (items: VocabularyItem[]): VocabularyItem[] => {
    if (!searchQuery.value) return items

    const query = searchQuery.value.toLowerCase().trim()
    return items.filter((item) => {
      const searchableFields = [
        item.text,
        item.translation,
        item.notes,
        item.context,
      ].filter(Boolean)

      return searchableFields.some((field) =>
        field!.toLowerCase().includes(query)
      )
    })
  }

  const applyVideoFilter = (items: VocabularyItem[]): VocabularyItem[] => {
    if (videoFilter.value === 'all') return items
    return items.filter((item) => item.videoTitle === videoFilter.value)
  }

  const applySorting = (items: VocabularyItem[]): VocabularyItem[] => {
    const sorted = [...items]

    if (sortBy.value === SORT_OPTIONS.RECENT) {
      sorted.sort((a, b) => b.timestamp - a.timestamp)
    } else {
      sorted.sort((a, b) => a.text.localeCompare(b.text))
    }

    return sorted
  }

  const filteredItems = computed(() => {
    let items = vocabularyStore.items

    items = applySearchFilter(items)
    items = applyDateFilter(items)
    items = applyVideoFilter(items)
    items = applySorting(items)

    return items
  })

  const hasActiveFilters = computed(() => {
    return (
      dateFilter.value !== DATE_FILTERS.ALL ||
      videoFilter.value !== 'all' ||
      sortBy.value !== SORT_OPTIONS.RECENT ||
      searchQuery.value !== ''
    )
  })

  const clearAllFilters = () => {
    dateFilter.value = DATE_FILTERS.ALL
    videoFilter.value = 'all'
    sortBy.value = SORT_OPTIONS.RECENT
    searchQuery.value = ''
  }

  const resetVideoFilter = () => {
    videoFilter.value = 'all'
  }

  const getFilterState = (): FilterState => ({
    searchQuery: searchQuery.value,
    dateFilter: dateFilter.value,
    sortBy: sortBy.value,
    videoFilter: videoFilter.value,
  })

  return {
    searchQuery,
    dateFilter,
    sortBy,
    videoFilter,
    uniqueVideos,
    filteredItems,
    hasActiveFilters,
    clearAllFilters,
    resetVideoFilter,
    getFilterState,
  }
}
