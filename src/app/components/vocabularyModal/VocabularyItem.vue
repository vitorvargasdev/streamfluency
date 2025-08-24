<script setup lang="ts">
import type { VocabularyItem } from '../../stores/vocabulary/types'

const props = defineProps<{
  item: VocabularyItem
  isEditing: boolean
  editingTranslation: string
  editingNotes: string
  editingContext: string
  dateLabel: string
  videoButtonText: string
}>()

const emit = defineEmits<{
  startEdit: []
  saveEdit: []
  cancelEdit: []
  delete: []
  videoClick: [event: Event]
  showDetails: []
  updateTranslation: [value: string]
  updateNotes: [value: string]
  updateContext: [value: string]
}>()

const hasDetails = () => {
  return props.item.translation || props.item.notes || props.item.context
}
</script>

<template>
  <div class="vocabulary-item">
    <div class="item-header">
      <span class="item-date">{{ dateLabel }}</span>
      <div class="item-content">
        <div class="item-text">{{ item.text }}</div>

        <div v-if="item.context && !isEditing" class="item-context">
          "{{ item.context }}"
        </div>

        <div v-if="isEditing" class="item-edit">
          <input
            :value="editingContext"
            @input="
              $emit('updateContext', ($event.target as HTMLInputElement).value)
            "
            type="text"
            placeholder="Contexto da frase..."
            class="edit-input"
          />
          <input
            :value="editingTranslation"
            @input="
              $emit(
                'updateTranslation',
                ($event.target as HTMLInputElement).value
              )
            "
            type="text"
            placeholder="Tradução..."
            class="edit-input"
            @keyup.enter="$emit('saveEdit')"
            @keyup.esc="$emit('cancelEdit')"
          />
          <textarea
            :value="editingNotes"
            @input="
              $emit('updateNotes', ($event.target as HTMLTextAreaElement).value)
            "
            placeholder="Notas..."
            class="edit-textarea"
            rows="2"
          />
          <div class="edit-actions">
            <button @click="$emit('saveEdit')" class="save-btn">Salvar</button>
            <button @click="$emit('cancelEdit')" class="cancel-btn">
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
            v-if="!isEditing"
            @click="$emit('startEdit')"
            class="action-btn edit-btn"
          >
            {{ hasDetails() ? 'Editar' : 'Adicionar detalhes' }}
          </button>
          <a
            v-if="item.videoUrl"
            :href="item.videoUrl"
            target="_blank"
            class="action-btn video-link"
            :title="item.videoTitle"
            @click="$emit('videoClick', $event)"
          >
            {{ videoButtonText }}
          </a>
          <button
            @click="$emit('delete')"
            class="action-btn delete-btn"
            title="Remover"
          >
            Remover
          </button>
          <button
            @click="$emit('showDetails')"
            class="action-btn details-btn"
            title="Ver tradução e significados"
          >
            Ver Detalhes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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

@media (max-width: 768px) {
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
}
</style>
