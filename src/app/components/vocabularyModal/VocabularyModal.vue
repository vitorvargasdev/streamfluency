<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVocabularyStore } from '../../stores/vocabulary'
import { useSettingStore } from '../../stores/setting'
import { usePlayerStore } from '../../stores/player'
import type { VocabularyItem } from '../../stores/vocabulary/types'
import GenericModal from '../genericModal/GenericModal.vue'
import { translationService } from '../../services/translation/translation.service'
import { isSameVideo, formatVideoTime } from '../../utils/platformMatcher'
import type {
  DictionaryResult,
  TranslationResult,
} from '../../services/translation/types'

const props = defineProps<{
  isVisible: boolean
}>()

const emit = defineEmits<{
  'update:isVisible': [value: boolean]
  close: []
}>()

const vocabularyStore = useVocabularyStore()
const settingStore = useSettingStore()
const playerStore = usePlayerStore()

const searchQuery = ref('')
const editingId = ref<string | null>(null)
const editingTranslation = ref('')
const editingNotes = ref('')
const editingContext = ref('')

// Details popup state
const detailsPopupVisible = ref(false)
const selectedWord = ref<VocabularyItem | null>(null)
const detailsPopupRef = ref<HTMLDivElement>()
const isTranslating = ref(false)
const isLoadingDefinition = ref(false)
const isTranslatingContext = ref(false)
const translationData = ref<TranslationResult | null>(null)
const dictionaryData = ref<DictionaryResult | null>(null)
const contextTranslationData = ref<TranslationResult | null>(null)
const targetLanguage = ref('Português')
const detailsPopupPosition = ref({ x: 0, y: 0 })

const filteredItems = computed(() => {
  if (!searchQuery.value) {
    return vocabularyStore.sortedItems
  }
  return vocabularyStore.searchItems(searchQuery.value)
})

const detailsPopupStyle = computed(() => ({
  left: `${detailsPopupPosition.value.x}px`,
  top: `${detailsPopupPosition.value.y}px`,
}))

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 7) return `${days} dias atrás`
  if (days < 30) return `${Math.floor(days / 7)} semanas atrás`

  return date.toLocaleDateString('pt-BR')
}

const getVideoButtonText = (item: VocabularyItem) => {
  const currentUrl = window.location.href

  if (
    isSameVideo(item.videoUrl, currentUrl) &&
    item.videoTimestamp !== undefined
  ) {
    return `Ir para ${formatVideoTime(item.videoTimestamp)}`
  }
  return 'Ver vídeo'
}

const truncateTitle = (title: string, maxLength = 30) => {
  if (title.length <= maxLength) return title
  return title.substring(0, maxLength) + '...'
}

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

const handleSaveEdit = async (id: string) => {
  await vocabularyStore.updateItem(id, {
    translation: editingTranslation.value,
    notes: editingNotes.value,
    context: editingContext.value,
  })
  cancelEdit()
}

const handleDelete = async (id: string) => {
  if (confirm('Remover esta palavra do vocabulário?')) {
    await vocabularyStore.deleteItem(id)
  }
}

const handleClearAll = async () => {
  if (confirm('Limpar todo o vocabulário? Esta ação não pode ser desfeita.')) {
    await vocabularyStore.clearAll()
  }
}

const handleVideoClick = (item: VocabularyItem, event: Event) => {
  if (!item.videoUrl) return

  const currentUrl = window.location.href

  if (isSameVideo(item.videoUrl, currentUrl)) {
    // Same video - jump to timestamp and close modal
    event.preventDefault()

    if (item.videoTimestamp !== undefined) {
      playerStore.seekTo(item.videoTimestamp)
    }

    // Auto-play the video
    playerStore.play()

    // Close the modal
    emit('update:isVisible', false)
    emit('close')
  }
  // If different video, let the default link behavior work
}

const showWordDetails = async (item: VocabularyItem) => {
  selectedWord.value = item
  detailsPopupVisible.value = true

  // Position popup in center of screen
  const popupWidth = 400
  const viewportWidth = window.innerWidth
  const topOffset = 100

  detailsPopupPosition.value = {
    x: (viewportWidth - popupWidth) / 2,
    y: topOffset,
  }

  // Reset states
  translationData.value = null
  dictionaryData.value = null
  contextTranslationData.value = null

  // Update target language
  const langNames: Record<string, string> = {
    pt: 'Português',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
    ru: 'Русский',
    ar: 'العربية',
  }
  targetLanguage.value =
    langNames[settingStore.providers.targetLanguage] || 'Português'

  // Initialize translation service
  translationService.initWithSettings(
    settingStore.providers.translation,
    settingStore.providers.dictionary
  )

  // Fetch translation
  isTranslating.value = true
  try {
    const result = await translationService.translate(
      item.text,
      'en',
      settingStore.providers.targetLanguage
    )
    translationData.value = result
  } catch (error) {
    console.error('Error fetching translation:', error)
  } finally {
    isTranslating.value = false
  }

  // Fetch dictionary definition
  isLoadingDefinition.value = true
  try {
    const result = await translationService.getDefinition(item.text)
    dictionaryData.value = result
  } catch (error) {
    console.error('Error fetching definition:', error)
  } finally {
    isLoadingDefinition.value = false
  }
}

const translateContext = async () => {
  if (!selectedWord.value?.context || isTranslatingContext.value) return

  isTranslatingContext.value = true
  try {
    const result = await translationService.translate(
      selectedWord.value.context,
      'en',
      settingStore.providers.targetLanguage
    )
    contextTranslationData.value = result
  } catch (error) {
    console.error('Error translating context:', error)
  } finally {
    isTranslatingContext.value = false
  }
}

const closeDetailsPopup = () => {
  detailsPopupVisible.value = false
  selectedWord.value = null
  translationData.value = null
  dictionaryData.value = null
  contextTranslationData.value = null
}
</script>

<template>
  <GenericModal
    :model-value="isVisible"
    title="Vocabulário"
    size="xlarge"
    :show-cancel-button="false"
    :show-confirm-button="false"
    @update:model-value="$emit('update:isVisible', $event)"
    @close="$emit('close')"
  >
    <template #body>
      <div class="vocabulary-container">
        <!-- Fixed search header -->
        <div class="search-header">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar palavras..."
            class="search-input"
          />
          <button
            v-if="filteredItems.length > 0"
            @click="handleClearAll"
            class="clear-all-btn"
          >
            Limpar Tudo
          </button>
        </div>

        <!-- Scrollable content area -->
        <div class="vocabulary-list-wrapper">
          <div v-if="filteredItems.length === 0" class="empty-state">
            <p>
              {{
                searchQuery
                  ? 'Nenhuma palavra encontrada'
                  : 'Nenhuma palavra salva ainda'
              }}
            </p>
            <p class="hint">
              Selecione palavras nas legendas para salvá-las aqui
            </p>
          </div>

          <div v-else class="vocabulary-list">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="vocabulary-item"
            >
              <div class="item-header">
                <span class="item-date">{{ formatDate(item.timestamp) }}</span>
                <div class="item-content">
                  <div class="item-text">{{ item.text }}</div>
                  <div
                    v-if="item.context && editingId !== item.id"
                    class="item-context"
                  >
                    "{{ item.context }}"
                  </div>

                  <div v-if="editingId === item.id" class="item-edit">
                    <input
                      v-model="editingContext"
                      type="text"
                      placeholder="Contexto da frase..."
                      class="edit-input"
                    />
                    <input
                      v-model="editingTranslation"
                      type="text"
                      placeholder="Tradução..."
                      class="edit-input"
                      @keyup.enter="handleSaveEdit(item.id)"
                      @keyup.esc="cancelEdit"
                    />
                    <textarea
                      v-model="editingNotes"
                      placeholder="Notas..."
                      class="edit-textarea"
                      rows="2"
                    />
                    <div class="edit-actions">
                      <button @click="handleSaveEdit(item.id)" class="save-btn">
                        Salvar
                      </button>
                      <button @click="cancelEdit" class="cancel-btn">
                        Cancelar
                      </button>
                    </div>
                  </div>

                  <div v-else class="item-details">
                    <div v-if="item.translation" class="item-translation">
                      {{ item.translation }}
                    </div>
                    <div v-if="item.notes" class="item-notes">
                      {{ item.notes }}
                    </div>
                  </div>

                  <div class="item-actions">
                    <button
                      v-if="editingId !== item.id"
                      @click="startEdit(item)"
                      class="action-btn edit-btn"
                    >
                      {{
                        item.translation || item.notes || item.context
                          ? 'Editar'
                          : 'Adicionar detalhes'
                      }}
                    </button>
                    <a
                      v-if="item.videoUrl"
                      :href="item.videoUrl"
                      target="_blank"
                      class="action-btn video-link"
                      :title="item.videoTitle"
                      @click="handleVideoClick(item, $event)"
                    >
                      {{ getVideoButtonText(item) }}
                    </a>
                    <button
                      @click="handleDelete(item.id)"
                      class="action-btn delete-btn"
                      title="Remover"
                    >
                      Remover
                    </button>
                    <button
                      @click="showWordDetails(item)"
                      class="action-btn details-btn"
                      title="Ver tradução e significados"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fixed footer with count -->
        <div class="vocabulary-footer">
          <span class="item-count">
            {{ filteredItems.length }}
            {{ filteredItems.length === 1 ? 'palavra' : 'palavras' }}
          </span>
        </div>
      </div>
    </template>
  </GenericModal>

  <!-- Word Details Popup -->
  <Teleport to="body">
    <div
      v-if="detailsPopupVisible"
      ref="detailsPopupRef"
      class="word-details-popup"
      :style="detailsPopupStyle"
    >
      <div class="popup-header">
        <div class="selected-text">{{ selectedWord?.text }}</div>
        <button class="close-btn" @click="closeDetailsPopup" title="Fechar">
          ×
        </button>
      </div>
      <div class="popup-content">
        <div v-if="selectedWord?.context" class="context-section">
          <div class="context-header">
            <div class="context-label">Contexto</div>
            <button
              v-if="!contextTranslationData"
              @click="translateContext"
              class="translate-context-btn"
              :disabled="isTranslatingContext"
              title="Traduzir frase de contexto"
            >
              {{ isTranslatingContext ? 'Traduzindo...' : 'Traduzir Frase' }}
            </button>
          </div>
          <div class="context-text">"{{ selectedWord.context }}"</div>
          <div v-if="contextTranslationData" class="context-translation">
            <div class="translation-label">Tradução do contexto</div>
            <div class="translated-text">
              {{ contextTranslationData.translatedText }}
            </div>
          </div>
        </div>

        <div v-if="translationData" class="translation-section">
          <div class="translation-label">Tradução ({{ targetLanguage }})</div>
          <div class="translation-text">
            {{ translationData.translatedText }}
          </div>
          <div class="translation-service">
            via {{ translationData?.service }}
          </div>
        </div>

        <div v-else-if="isTranslating" class="loading">
          <span class="loading-spinner"></span>
          Traduzindo...
        </div>

        <div v-if="isLoadingDefinition" class="loading">
          <span class="loading-spinner"></span>
          Buscando definição...
        </div>

        <div
          v-else-if="dictionaryData && dictionaryData.meanings.length > 0"
          class="dictionary-content"
        >
          <div v-if="dictionaryData.phonetic" class="phonetic">
            {{ dictionaryData.phonetic }}
          </div>

          <div class="definitions">
            <div
              v-for="(meaning, index) in dictionaryData.meanings.slice(0, 2)"
              :key="index"
              class="definition-item"
            >
              <span v-if="meaning.partOfSpeech" class="part-of-speech">{{
                meaning.partOfSpeech
              }}</span>
              <span class="definition">{{ meaning.definition }}</span>
              <span v-if="meaning.example" class="example"
                >"{{ meaning.example }}"</span
              >
            </div>
          </div>
        </div>

        <div
          v-else-if="!isLoadingDefinition && !dictionaryData"
          class="no-definition"
        >
          Nenhuma definição encontrada
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.vocabulary-container {
  display: flex;
  flex-direction: column;
  height: 65vh;
  margin: -18px;
  background: #1e1e1e;
  position: relative;
}

.search-header {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #1a1a1a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;

  .search-input {
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #fff;
    font-size: 14px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    &:focus {
      outline: none;
      border-color: rgba(102, 126, 234, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .clear-all-btn {
    padding: 8px 16px;
    background: rgba(211, 47, 47, 0.2);
    color: #ef5350;
    border: 1px solid rgba(211, 47, 47, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;

    &:hover {
      background: rgba(211, 47, 47, 0.3);
      border-color: rgba(211, 47, 47, 0.5);
    }
  }
}

.vocabulary-list-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.vocabulary-list {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 12px;
  position: relative;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  .vocabulary-item {
    margin-bottom: 4px;

    .item-header {
      display: flex;
      gap: 12px;
      padding: 10px;
      border-radius: 6px;
      cursor: default;
      transition: all 0.2s ease;
      align-items: flex-start;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      .item-date {
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        font-family: monospace;
        min-width: 45px;
        flex-shrink: 0;
        padding-top: 2px;
      }

      .item-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;

        .item-text {
          color: #667eea;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.4;
          word-break: break-word;
        }

        .item-context {
          color: rgba(255, 255, 255, 0.65);
          font-size: 13px;
          font-style: italic;
          line-height: 1.4;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          border-left: 2px solid rgba(102, 126, 234, 0.3);
        }

        .item-edit {
          margin-top: 8px;

          .edit-input,
          .edit-textarea {
            width: 100%;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            color: #fff;
            font-size: 13px;
            margin-bottom: 8px;

            &::placeholder {
              color: rgba(255, 255, 255, 0.3);
            }

            &:focus {
              outline: none;
              border-color: rgba(102, 126, 234, 0.5);
              background: rgba(255, 255, 255, 0.08);
            }
          }

          .edit-textarea {
            resize: vertical;
            min-height: 50px;
            font-family: inherit;
          }

          .edit-actions {
            display: flex;
            gap: 8px;

            .save-btn,
            .cancel-btn {
              padding: 6px 14px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 500;
              transition: all 0.2s;
            }

            .save-btn {
              background: rgba(76, 175, 80, 0.2);
              color: #4caf50;
              border: 1px solid rgba(76, 175, 80, 0.3);

              &:hover {
                background: rgba(76, 175, 80, 0.3);
                border-color: rgba(76, 175, 80, 0.5);
              }
            }

            .cancel-btn {
              background: rgba(255, 255, 255, 0.05);
              color: rgba(255, 255, 255, 0.6);
              border: 1px solid rgba(255, 255, 255, 0.1);

              &:hover {
                background: rgba(255, 255, 255, 0.08);
                color: rgba(255, 255, 255, 0.8);
              }
            }
          }
        }

        .item-details {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .item-translation {
            color: rgba(255, 255, 255, 0.85);
            font-size: 13px;
            line-height: 1.4;
            padding: 4px 8px;
            background: rgba(102, 126, 234, 0.08);
            border-radius: 4px;
          }

          .item-notes {
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            line-height: 1.4;
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 4px;
          }
        }

        .item-actions {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: wrap;

          .action-btn {
            padding: 4px 10px;
            background: transparent;
            color: rgba(255, 255, 255, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;

            &:hover {
              background: rgba(255, 255, 255, 0.05);
              color: rgba(255, 255, 255, 0.8);
              border-color: rgba(255, 255, 255, 0.25);
            }

            &.edit-btn:hover {
              color: #667eea;
              border-color: rgba(102, 126, 234, 0.5);
            }

            &.video-link:hover {
              color: #4fc3f7;
              border-color: rgba(79, 195, 247, 0.5);
            }

            &.delete-btn:hover {
              color: #ef5350;
              border-color: rgba(239, 83, 80, 0.5);
            }

            &.details-btn:hover {
              color: #29b6f6;
              border-color: rgba(41, 182, 246, 0.5);
              background: rgba(41, 182, 246, 0.1);
            }
          }
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);

  p {
    margin: 10px 0;
    font-size: 14px;
  }

  .hint {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.3);
  }
}

.vocabulary-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background: linear-gradient(
    to bottom,
    rgba(26, 26, 26, 0.95),
    rgba(26, 26, 26, 1)
  );
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  backdrop-filter: blur(10px);

  .item-count {
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .vocabulary-container {
    height: 70vh;
  }

  .search-header {
    padding: 10px;
  }

  .vocabulary-list {
    padding: 6px 8px;
  }

  .vocabulary-item {
    .item-header {
      padding: 8px;

      .item-date {
        font-size: 11px;
        min-width: 40px;
      }

      .item-content {
        .item-text {
          font-size: 14px;
        }

        .item-context {
          font-size: 12px;
        }
      }
    }
  }

  .vocabulary-footer {
    padding: 10px;
  }
}

.word-details-popup {
  position: fixed;
  z-index: 10001;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.15),
      rgba(102, 126, 234, 0.05)
    );
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px 12px 0 0;

    .selected-text {
      color: #667eea;
      font-size: 16px;
      font-weight: 600;
      word-break: break-word;
      flex: 1;
      margin-right: 10px;
    }

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      font-size: 24px;
      cursor: pointer;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
      flex-shrink: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  .popup-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex: 1;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;

    .loading-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }

  .translation-section {
    margin-bottom: 12px;
    padding: 12px;
    background: rgba(102, 126, 234, 0.08);
    border-radius: 8px;
    border: 1px solid rgba(102, 126, 234, 0.15);

    .translation-label {
      color: #667eea;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .translation-text {
      color: rgba(255, 255, 255, 0.95);
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 6px;
    }

    .translation-service {
      color: rgba(255, 255, 255, 0.4);
      font-size: 11px;
      font-style: italic;
    }
  }

  .dictionary-content {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .phonetic {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      font-style: italic;
      padding: 8px 12px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 8px;
      display: inline-block;
      align-self: flex-start;
      border: 1px solid rgba(102, 126, 234, 0.2);
    }

    .definitions {
      .definition-item {
        margin-bottom: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 8px;
        transition: all 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(2px);
        }

        .part-of-speech {
          display: inline-block;
          color: #667eea;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-right: 10px;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          background: rgba(102, 126, 234, 0.15);
          border-radius: 4px;
        }

        .definition {
          color: rgba(255, 255, 255, 0.95);
          font-size: 14px;
          line-height: 1.6;
          display: block;
          margin-top: 6px;
        }

        .example {
          display: block;
          color: rgba(255, 255, 255, 0.65);
          font-size: 13px;
          font-style: italic;
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
        }
      }
    }
  }

  .no-definition {
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    text-align: center;
    padding: 10px 0;
  }

  .context-section {
    margin-bottom: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border-left: 3px solid rgba(102, 126, 234, 0.4);

    .context-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .context-label {
        color: rgba(102, 126, 234, 0.8);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .translate-context-btn {
        padding: 4px 10px;
        background: rgba(102, 126, 234, 0.15);
        color: #667eea;
        border: 1px solid rgba(102, 126, 234, 0.3);
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          background: rgba(102, 126, 234, 0.25);
          border-color: rgba(102, 126, 234, 0.5);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    .context-text {
      color: rgba(255, 255, 255, 0.85);
      font-size: 14px;
      font-style: italic;
      line-height: 1.6;
    }

    .context-translation {
      margin-top: 12px;
      padding: 10px;
      background: rgba(102, 126, 234, 0.08);
      border-radius: 6px;
      border: 1px solid rgba(102, 126, 234, 0.15);

      .translation-label {
        color: rgba(102, 126, 234, 0.9);
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }

      .translated-text {
        color: rgba(255, 255, 255, 0.95);
        font-size: 13px;
        line-height: 1.5;
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
