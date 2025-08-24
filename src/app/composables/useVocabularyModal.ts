import { useVocabularyStore } from '../stores/vocabulary'
import { usePlayerStore } from '../stores/player'
import { useVocabularyFilters } from './useVocabularyFilters'
import { useVocabularyEdit } from './useVocabularyEdit'
import { isSameVideo, formatVideoTime } from '../utils/platformMatcher'
import { MESSAGES, TIME_PERIODS } from '../components/vocabularyModal/constants'
import type { VocabularyItem } from '../stores/vocabulary/types'

interface EmitFunction {
  (event: 'update:isVisible', value: boolean): void
  (event: 'close'): void
}

export function useVocabularyModal(emit: EmitFunction) {
  const vocabularyStore = useVocabularyStore()
  const playerStore = usePlayerStore()

  const filters = useVocabularyFilters()
  const editing = useVocabularyEdit()

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / TIME_PERIODS.DAY)

    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 7) return `${days} dias atrás`
    if (days < 30) return `${Math.floor(days / 7)} semanas atrás`
    return date.toLocaleDateString('pt-BR')
  }

  const getVideoButtonText = (item: VocabularyItem): string => {
    if (!item.videoUrl) return 'Ver vídeo'

    const currentUrl = window.location.href
    const isSame = isSameVideo(item.videoUrl, currentUrl)
    const hasTimestamp = item.videoTimestamp !== undefined

    if (isSame && hasTimestamp) {
      return `Ir para ${formatVideoTime(item.videoTimestamp)}`
    }

    return 'Ver vídeo'
  }

  const handleDelete = async (id: string) => {
    if (!confirm(MESSAGES.CONFIRM_DELETE)) return
    await vocabularyStore.deleteItem(id)
  }

  const handleClearAll = async () => {
    if (!confirm(MESSAGES.CONFIRM_CLEAR_ALL)) return
    await vocabularyStore.clearAll()
  }

  const handleVideoClick = (item: VocabularyItem, event: Event) => {
    if (!item.videoUrl) return

    const currentUrl = window.location.href
    if (!isSameVideo(item.videoUrl, currentUrl)) return

    event.preventDefault()

    if (item.videoTimestamp !== undefined) {
      playerStore.seekTo(item.videoTimestamp)
    }

    playerStore.play()
    emit('update:isVisible', false)
    emit('close')
  }

  return {
    ...filters,
    ...editing,
    vocabularyStore,
    formatDate,
    getVideoButtonText,
    handleDelete,
    handleClearAll,
    handleVideoClick,
  }
}
