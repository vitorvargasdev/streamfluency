import { ref } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'
import type { VocabularyItem } from '../stores/vocabulary/types'
import type { EditState } from '../components/vocabularyModal/types'

export function useVocabularyEdit() {
  const vocabularyStore = useVocabularyStore()

  const editingId = ref<string | null>(null)
  const editingTranslation = ref('')
  const editingNotes = ref('')
  const editingContext = ref('')

  const startEdit = (item: VocabularyItem) => {
    editingId.value = item.id
    editingTranslation.value = item.translation || ''
    editingNotes.value = item.notes || ''
    editingContext.value = item.context || ''
  }

  const cancelEdit = () => {
    editingId.value = null
    editingTranslation.value = ''
    editingNotes.value = ''
    editingContext.value = ''
  }

  const saveEdit = async (id: string) => {
    if (editingId.value !== id) return

    await vocabularyStore.updateItem(id, {
      translation: editingTranslation.value,
      notes: editingNotes.value,
      context: editingContext.value,
    })

    cancelEdit()
  }

  const isEditing = (id: string) => editingId.value === id

  const getEditState = (): EditState => ({
    editingId: editingId.value,
    editingTranslation: editingTranslation.value,
    editingNotes: editingNotes.value,
    editingContext: editingContext.value,
  })

  return {
    editingId,
    editingTranslation,
    editingNotes,
    editingContext,
    startEdit,
    cancelEdit,
    saveEdit,
    isEditing,
    getEditState,
  }
}
