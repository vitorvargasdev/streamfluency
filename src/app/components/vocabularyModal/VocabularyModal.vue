<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVocabularyStore } from '../../stores/vocabulary'
import { usePlayerStore } from '../../stores/player'
import type { VocabularyItem } from '../../stores/vocabulary/types'
import GenericModal from '../genericModal/GenericModal.vue'
import SelectionPopup from '../selectionPopup/SelectionPopup.vue'
import { isSameVideo, formatVideoTime } from '../../utils/platformMatcher'

const props = defineProps<{
  isVisible: boolean
}>()

const emit = defineEmits<{
  'update:isVisible': [value: boolean]
  close: []
}>()

const vocabularyStore = useVocabularyStore()
const playerStore = usePlayerStore()

const searchQuery = ref('')
const editingId = ref<string | null>(null)
const editingTranslation = ref('')
const editingNotes = ref('')
const editingContext = ref('')

// Selection popup reference
const selectionPopupRef = ref<InstanceType<typeof SelectionPopup>>()

const filteredItems = computed(() => {
  if (!searchQuery.value) {
    return vocabularyStore.sortedItems
  }
  return vocabularyStore.searchItems(searchQuery.value)
})

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

const showWordDetails = (item: VocabularyItem) => {
  selectionPopupRef.value?.showVocabularyItem(item)
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

  <!-- Selection Popup for vocabulary details -->
  <SelectionPopup ref="selectionPopupRef" mode="vocabulary" />
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
</style>
